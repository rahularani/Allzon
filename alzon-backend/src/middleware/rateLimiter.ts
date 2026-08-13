import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';
import { env } from '../config/env';

const isDev = env.NODE_ENV === 'development';

/**
 * Global rate limiter: 100 requests per 15 minutes per IP (10,000 in dev).
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests, please try again later.', 429, 'RATE_LIMITED');
  },
});

/**
 * Auth limiter: 10 requests per 15 minutes per IP (1,000 in dev).
 * Applied only to /api/v1/auth/* routes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many authentication attempts. Please wait 15 minutes.',
      429,
      'AUTH_RATE_LIMITED',
    );
  },
});

/**
 * OTP limiter: 5 OTP requests per 15 minutes per IP (500 in dev).
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many OTP requests. Please wait before requesting another.',
      429,
      'OTP_RATE_LIMITED',
    );
  },
});
