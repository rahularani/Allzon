import { Request, Response, NextFunction } from 'express';
import {
  sendOTPService,
  verifyOTPService,
  registerService,
  loginService,
  refreshTokenService,
  logoutService,
  getMeService,
  forgotPasswordService,
  resetPasswordService,
  getRefreshCookieOptions,
} from './auth.service';
import { sendSuccess } from '../../utils/response';

import { badRequest, unauthorized } from '../../middleware/error.middleware';

function getCookieName(req: Request): string {
  const portal = req.headers['x-portal'];
  if (!portal) {
    throw badRequest('X-Portal header is required');
  }
  if (portal === 'buyer') return 'allzon_buyer_refresh';
  if (portal === 'supplier') return 'allzon_supplier_refresh';
  if (portal === 'admin') return 'allzon_admin_refresh';
  throw badRequest('Invalid X-Portal header value');
}

function setRefreshCookie(res: Response, token: string, cookieName: string): void {
  res.cookie(cookieName, token, getRefreshCookieOptions());
}

function clearRefreshCookie(res: Response, cookieName: string): void {
  res.clearCookie(cookieName, { path: '/api/v1/auth' });
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export async function sendOTPHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await sendOTPService(req.body);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

export async function verifyOTPHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await verifyOTPService(req.body);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const portal = req.headers['x-portal'] as string;
    const cookieName = getCookieName(req);
    const { user, accessToken, rawRefreshToken } = await registerService(req.body);

    if (portal === 'buyer' && user.role !== 'BUYER') {
      throw unauthorized('Access denied for Buyer portal');
    }
    if (portal === 'supplier' && user.role !== 'SUPPLIER') {
      throw unauthorized('Access denied for Supplier portal');
    }
    if (portal === 'admin' && user.role !== 'ADMIN' && user.role !== 'VERIFICATION_STAFF') {
      throw unauthorized('Access denied for Admin portal');
    }

    setRefreshCookie(res, rawRefreshToken, cookieName);
    sendSuccess(res, { user, accessToken }, 'Account created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const portal = req.headers['x-portal'] as string;
    const cookieName = getCookieName(req);
    const { user, accessToken, rawRefreshToken } = await loginService(req.body);

    if (portal === 'buyer' && user.role !== 'BUYER') {
      throw unauthorized('Access denied for Buyer portal');
    }
    if (portal === 'supplier' && user.role !== 'SUPPLIER') {
      throw unauthorized('Access denied for Supplier portal');
    }
    if (portal === 'admin' && user.role !== 'ADMIN' && user.role !== 'VERIFICATION_STAFF') {
      throw unauthorized('Access denied for Admin portal');
    }

    setRefreshCookie(res, rawRefreshToken, cookieName);
    sendSuccess(res, { user, accessToken }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const portal = req.headers['x-portal'] as string;
    const cookieName = getCookieName(req);
    const rawToken: string = req.cookies?.[cookieName] ?? '';
    const { accessToken, rawRefreshToken } = await refreshTokenService(rawToken, portal);
    setRefreshCookie(res, rawRefreshToken, cookieName);
    sendSuccess(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const cookieName = getCookieName(req);
    const rawToken: string = req.cookies?.[cookieName] ?? '';
    await logoutService(rawToken);
    clearRefreshCookie(res, cookieName);
    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function meHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await getMeService(req.user!.id);
    sendSuccess(res, user, 'User profile fetched');
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await forgotPasswordService(req.body.phone);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await resetPasswordService(req.body);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}
