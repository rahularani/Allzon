import crypto from 'crypto';
import { prisma } from '../../config/database';
import { hashPassword, comparePassword, hashToken, compareToken } from '../../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { generateOTP, sendOTP } from '../../utils/otp';
import {
  AppError,
  badRequest,
  conflict,
  notFound,
  unauthorized,
} from '../../middleware/error.middleware';
import { env } from '../../config/env';
import type {
  RegisterInput,
  LoginInput,
  SendOTPInput,
  VerifyOTPInput,
  ResetPasswordInput,
} from './auth.schema';

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 3;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRefreshCookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ('none' as const) : ('lax' as const),
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  };
}

/** Generate a raw refresh token string and store its hash in the DB. */
async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = await hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

/** Build the safe user object returned to the client. */
function safeUser(user: { id: string; phone: string; email: string | null; role: string; isVerified: boolean }) {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  };
}

// ─── Service Methods ─────────────────────────────────────────────────────────

export async function sendOTPService(input: SendOTPInput): Promise<{ message: string }> {
  const { phone, purpose } = input;

  // For 'login' and 'reset', user must exist
  if (purpose === 'login' || purpose === 'reset') {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) throw notFound('No account found with this phone number');
    if (!user.isActive) throw unauthorized('Your account has been suspended');
  }

  // For 'register', phone must not already be in use
  if (purpose === 'register') {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) throw conflict('An account with this phone number already exists');
  }

  // Invalidate any existing unused OTPs for this phone + purpose
  await prisma.oTPRecord.updateMany({
    where: { phone, purpose, isUsed: false },
    data: { isUsed: true },
  });

  const otp = generateOTP();
  const otpHash = await hashToken(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.oTPRecord.create({
    data: { phone, otpHash, purpose, expiresAt },
  });

  await sendOTP(phone, otp);
  return { message: `OTP sent to ${phone}` };
}

export async function verifyOTPService(
  input: VerifyOTPInput,
): Promise<{ message: string; verified: boolean }> {
  const { phone, otp, purpose } = input;

  const record = await prisma.oTPRecord.findFirst({
    where: { phone, purpose, isUsed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) throw badRequest('OTP is invalid or has expired');

  // Increment attempt counter
  await prisma.oTPRecord.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
  });

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.oTPRecord.update({ where: { id: record.id }, data: { isUsed: true } });
    throw badRequest('OTP has been invalidated after too many failed attempts. Request a new OTP.');
  }

  const isMatch = await compareToken(otp, record.otpHash);
  if (!isMatch) {
    const remaining = OTP_MAX_ATTEMPTS - record.attempts - 1;
    throw badRequest(`Invalid OTP. ${remaining} attempt(s) remaining.`);
  }

  // Mark as used
  await prisma.oTPRecord.update({ where: { id: record.id }, data: { isUsed: true } });
  return { message: 'OTP verified successfully', verified: true };
}

export async function registerService(input: RegisterInput): Promise<{
  user: ReturnType<typeof safeUser>;
  accessToken: string;
  rawRefreshToken: string;
}> {
  const { phone, password, role, email } = input;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) throw conflict('An account with this phone number already exists');

  if (email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) throw conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { phone, passwordHash, role, email: email ?? null },
    select: { id: true, phone: true, email: true, role: true, isVerified: true },
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const rawRefreshToken = await createRefreshToken(user.id);

  return { user: safeUser(user), accessToken, rawRefreshToken };
}

export async function loginService(input: LoginInput): Promise<{
  user: ReturnType<typeof safeUser>;
  accessToken: string;
  rawRefreshToken: string;
}> {
  const { phone, password } = input;

  const user = await prisma.user.findUnique({
    where: { phone },
    select: {
      id: true,
      phone: true,
      email: true,
      role: true,
      isVerified: true,
      isActive: true,
      passwordHash: true,
    },
  });

  if (!user) throw unauthorized('Invalid phone number or password');
  if (!user.isActive) throw unauthorized('Your account has been suspended. Contact support.');

  const passwordValid = await comparePassword(password, user.passwordHash);
  if (!passwordValid) throw unauthorized('Invalid phone number or password');

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const rawRefreshToken = await createRefreshToken(user.id);

  return {
    user: safeUser({
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    }),
    accessToken,
    rawRefreshToken,
  };
}

export async function refreshTokenService(rawToken: string, portal?: string): Promise<{
  accessToken: string;
  rawRefreshToken: string;
}> {
  if (!rawToken) throw unauthorized('Refresh token is required');

  // Find all non-revoked, non-expired tokens for matching
  const tokens = await prisma.refreshToken.findMany({
    where: { isRevoked: false, expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, role: true, isActive: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100, // safety cap
  });

  let matched: (typeof tokens)[number] | undefined;
  for (const t of tokens) {
    if (await compareToken(rawToken, t.tokenHash)) {
      matched = t;
      break;
    }
  }

  if (!matched) throw unauthorized('Refresh token is invalid or expired');
  if (!matched.user.isActive) throw unauthorized('Account is suspended');

  // Validate user role matches the target portal
  if (portal === 'buyer' && matched.user.role !== 'BUYER') {
    throw unauthorized('Access denied: User is not a Buyer');
  }
  if (portal === 'supplier' && matched.user.role !== 'SUPPLIER') {
    throw unauthorized('Access denied: User is not a Supplier');
  }
  if (
    portal === 'admin' &&
    matched.user.role !== 'ADMIN' &&
    matched.user.role !== 'VERIFICATION_STAFF'
  ) {
    throw unauthorized('Access denied: User is not an Admin or Staff');
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: matched.id },
    data: { isRevoked: true },
  });

  const accessToken = signAccessToken({ sub: matched.user.id, role: matched.user.role });
  const rawRefreshToken = await createRefreshToken(matched.user.id);

  return { accessToken, rawRefreshToken };
}

export async function logoutService(rawToken: string): Promise<void> {
  if (!rawToken) return; // Idempotent — no token = already logged out

  const tokens = await prisma.refreshToken.findMany({
    where: { isRevoked: false },
    select: { id: true, tokenHash: true },
    take: 100,
  });

  for (const t of tokens) {
    if (await compareToken(rawToken, t.tokenHash)) {
      await prisma.refreshToken.update({
        where: { id: t.id },
        data: { isRevoked: true },
      });
      break;
    }
  }
}

export async function getMeService(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
      buyerProfile: { select: { id: true, fullName: true, businessName: true } },
      supplierProfile: {
        select: { id: true, businessName: true, slug: true, verificationStatus: true },
      },
    },
  });

  if (!user) throw notFound('User not found');
  return user;
}

export async function forgotPasswordService(phone: string): Promise<{ message: string }> {
  return sendOTPService({ phone, purpose: 'reset' });
}

export async function resetPasswordService(input: ResetPasswordInput): Promise<{ message: string }> {
  const { phone, otp, newPassword } = input;

  // Verify OTP first
  await verifyOTPService({ phone, otp, purpose: 'reset' });

  const passwordHash = await hashPassword(newPassword);
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw notFound('User not found');

  await prisma.user.update({ where: { phone }, data: { passwordHash } });

  // Revoke all refresh tokens on password reset
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, isRevoked: false },
    data: { isRevoked: true },
  });

  return { message: 'Password reset successfully. Please log in.' };
}

export { getRefreshCookieOptions };
