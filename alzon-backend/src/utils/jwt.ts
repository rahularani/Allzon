import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;   // userId
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Sign a short-lived access token (15 minutes).
 */
export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

/**
 * Sign a long-lived refresh token (7 days).
 */
export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

/**
 * Verify and decode an access token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

/**
 * Verify and decode a refresh token.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
