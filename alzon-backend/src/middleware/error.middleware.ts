import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';
import { env } from '../config/env';

/**
 * Custom application error with HTTP status and optional code.
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Convenience factories
export const notFound = (msg = 'Resource not found') =>
  new AppError(msg, 404, 'NOT_FOUND');

export const unauthorized = (msg = 'Unauthorized') =>
  new AppError(msg, 401, 'UNAUTHORIZED');

export const forbidden = (msg = 'Forbidden') =>
  new AppError(msg, 403, 'FORBIDDEN');

export const badRequest = (msg: string, details?: unknown) =>
  new AppError(msg, 400, 'BAD_REQUEST', details);

export const conflict = (msg: string) =>
  new AppError(msg, 409, 'CONFLICT');

/**
 * Global error handling middleware — must be registered last in Express.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    sendError(
      res,
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    );
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[AppError] ${err.message}`, { stack: err.stack });
    }
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Prisma unique constraint violation
  if (
    err instanceof Error &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  ) {
    sendError(res, 'A record with this value already exists', 409, 'CONFLICT');
    return;
  }

  // Prisma record not found
  if (
    err instanceof Error &&
    'code' in err &&
    (err as { code?: string }).code === 'P2025'
  ) {
    sendError(res, 'Record not found', 404, 'NOT_FOUND');
    return;
  }

  // Unknown errors
  logger.error('[UnhandledError]', { err });
  sendError(
    res,
    'An unexpected error occurred',
    500,
    'INTERNAL_SERVER_ERROR',
    env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined,
  );
}

/**
 * 404 handler for unmatched routes — register before errorHandler.
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404, 'ROUTE_NOT_FOUND');
}
