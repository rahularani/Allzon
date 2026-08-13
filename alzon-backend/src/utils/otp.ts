import crypto from 'crypto';
import { logger } from './logger';
import { env } from '../config/env';

/**
 * Generate a 6-digit numeric OTP.
 */
export function generateOTP(): string {
  // Cryptographically random 6-digit number
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
}

export interface SendOTPResult {
  success: boolean;
  message: string;
}

/**
 * Send an OTP via the configured provider.
 * Provider is selected by env.OTP_PROVIDER.
 * Add new providers here without changing callers.
 */
export async function sendOTP(phone: string, otp: string): Promise<SendOTPResult> {
  switch (env.OTP_PROVIDER) {
    case 'console':
      return sendConsoleOTP(phone, otp);
    case 'msg91':
      return sendMsg91OTP(phone, otp);
    case 'fast2sms':
      return sendFast2SmsOTP(phone, otp);
    case 'twilio':
      return sendTwilioOTP(phone, otp);
    default:
      return sendConsoleOTP(phone, otp);
  }
}

// ─── Console (Development) ───────────────────────────────────────────────────
async function sendConsoleOTP(phone: string, otp: string): Promise<SendOTPResult> {
  logger.info(`\n${'='.repeat(50)}`);
  logger.info(`  📱 OTP for ${phone}: ${otp}`);
  logger.info(`${'='.repeat(50)}\n`);
  return { success: true, message: 'OTP logged to console (development mode)' };
}

// ─── MSG91 ───────────────────────────────────────────────────────────────────
async function sendMsg91OTP(phone: string, otp: string): Promise<SendOTPResult> {
  // TODO: Implement MSG91 integration
  // Reference: https://docs.msg91.com/p/wuhrRwNp
  logger.warn('[OTP] MSG91 provider not yet implemented, falling back to console');
  return sendConsoleOTP(phone, otp);
}

// ─── Fast2SMS ────────────────────────────────────────────────────────────────
async function sendFast2SmsOTP(phone: string, otp: string): Promise<SendOTPResult> {
  // TODO: Implement Fast2SMS integration
  logger.warn('[OTP] Fast2SMS provider not yet implemented, falling back to console');
  return sendConsoleOTP(phone, otp);
}

// ─── Twilio ──────────────────────────────────────────────────────────────────
async function sendTwilioOTP(phone: string, otp: string): Promise<SendOTPResult> {
  // TODO: Implement Twilio integration
  logger.warn('[OTP] Twilio provider not yet implemented, falling back to console');
  return sendConsoleOTP(phone, otp);
}
