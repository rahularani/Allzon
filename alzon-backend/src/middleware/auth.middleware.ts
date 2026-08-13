import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { unauthorized } from './error.middleware';

/**
 * Verifies the Bearer access token from the Authorization header.
 * Attaches req.user = { id, role, phone } on success.
 * Throws 401 if token is missing, malformed, expired, or user is inactive.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw unauthorized('Access token is required');
    }

    const token = authHeader.slice(7); // strip "Bearer "
    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, phone: true, isActive: true },
    });

    if (!user) {
      throw unauthorized('User not found');
    }
    if (!user.isActive) {
      throw unauthorized('Your account has been suspended. Contact support.');
    }

    req.user = {
      id: user.id,
      role: user.role,
      phone: user.phone,
    };

    next();
  } catch (err: unknown) {
    // JWT errors (TokenExpiredError, JsonWebTokenError) → 401
    if (
      err instanceof Error &&
      (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError')
    ) {
      next(unauthorized('Access token is invalid or expired'));
      return;
    }
    next(err);
  }
}

/**
 * Optional authentication — attaches req.user if a valid token is present,
 * but does NOT throw if no token. Used for public routes that have
 * optional personalization (e.g., showing "saved" state on product cards).
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, phone: true, isActive: true },
    });

    if (user?.isActive) {
      req.user = { id: user.id, role: user.role, phone: user.phone };
    }

    next();
  } catch {
    // Silently ignore invalid tokens for optional auth
    next();
  }
}
