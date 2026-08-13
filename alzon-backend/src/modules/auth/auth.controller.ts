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

const REFRESH_COOKIE = 'refreshToken';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, getRefreshCookieOptions());
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
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
    const { user, accessToken, rawRefreshToken } = await registerService(req.body);
    setRefreshCookie(res, rawRefreshToken);
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
    const { user, accessToken, rawRefreshToken } = await loginService(req.body);
    setRefreshCookie(res, rawRefreshToken);
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
    const rawToken: string = req.cookies?.[REFRESH_COOKIE] ?? '';
    const { accessToken, rawRefreshToken } = await refreshTokenService(rawToken);
    setRefreshCookie(res, rawRefreshToken);
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
    const rawToken: string = req.cookies?.[REFRESH_COOKIE] ?? '';
    await logoutService(rawToken);
    clearRefreshCookie(res);
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
