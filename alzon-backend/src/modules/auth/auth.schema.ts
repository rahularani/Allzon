import { z } from 'zod';

const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile numbers

export const sendOTPSchema = z.object({
  phone: z
    .string()
    .regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  purpose: z.enum(['login', 'register', 'reset']),
});

export const verifyOTPSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
  purpose: z.enum(['login', 'register', 'reset']),
});

export const registerSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['BUYER', 'SUPPLIER']),
  email: z.string().email('Enter a valid email').optional(),
});

export const loginSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  otp: z.string().length(6).regex(/^\d+$/),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type SendOTPInput = z.infer<typeof sendOTPSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
