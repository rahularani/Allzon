import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { authLimiter, otpLimiter } from '../../middleware/rateLimiter';
import {
  sendOTPSchema,
  verifyOTPSchema,
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} from './auth.schema';
import {
  sendOTPHandler,
  verifyOTPHandler,
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from './auth.controller';

const router = Router();

// POST /api/v1/auth/send-otp        — send OTP to phone
router.post('/send-otp', otpLimiter, validate(sendOTPSchema), sendOTPHandler);

// POST /api/v1/auth/verify-otp      — verify OTP (standalone verification step)
router.post('/verify-otp', authLimiter, validate(verifyOTPSchema), verifyOTPHandler);

// POST /api/v1/auth/register        — create BUYER or SUPPLIER account
router.post('/register', authLimiter, validate(registerSchema), registerHandler);

// POST /api/v1/auth/login           — phone + password login
router.post('/login', authLimiter, validate(loginSchema), loginHandler);

// POST /api/v1/auth/refresh         — rotate refresh token → new access token
router.post('/refresh', refreshHandler);

// POST /api/v1/auth/logout          — revoke refresh token (authenticated)
router.post('/logout', authenticate, logoutHandler);

// GET  /api/v1/auth/me              — current user + profile links
router.get('/me', authenticate, meHandler);

// POST /api/v1/auth/forgot-password — send reset OTP
router.post(
  '/forgot-password',
  otpLimiter,
  validate(sendOTPSchema.pick({ phone: true }).extend({ phone: sendOTPSchema.shape.phone })),
  forgotPasswordHandler,
);

// POST /api/v1/auth/reset-password  — reset with OTP
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  resetPasswordHandler,
);

export default router;
