import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { forbidden, unauthorized } from './error.middleware';

/**
 * RBAC middleware factory.
 * Usage: router.get('/route', authenticate, requireRole('ADMIN', 'VERIFICATION_STAFF'), handler)
 *
 * Role is ALWAYS read from req.user (set by authenticate middleware from the JWT payload).
 * It is NEVER read from the request body, query params, or headers.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        forbidden(
          `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        ),
      );
      return;
    }

    next();
  };
}

// ─── Convenience role guards ─────────────────────────────────────────────────

/** Buyer-only routes */
export const requireBuyer = requireRole('BUYER');

/** Supplier-only routes */
export const requireSupplier = requireRole('SUPPLIER');

/** Admin-only routes (VERIFICATION_STAFF explicitly excluded) */
export const requireAdmin = requireRole('ADMIN');

/** Admin OR Verification Staff — for shared verification/product moderation routes */
export const requireAdminOrStaff = requireRole('ADMIN', 'VERIFICATION_STAFF');
