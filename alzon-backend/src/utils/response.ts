import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: {
    code?: string;
    details?: unknown;
  };
}

/**
 * Send a standardised success response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta | Record<string, unknown>,
): void {
  const body: ApiSuccessResponse<T> = { success: true, message, data };
  if (meta) body.meta = meta;
  res.status(statusCode).json(body);
}

/**
 * Send a standardised error response.
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  details?: unknown,
): void {
  const body: ApiErrorResponse = {
    success: false,
    message,
    error: { code, details },
  };
  res.status(statusCode).json(body);
}

/**
 * Build pagination meta from total count and query params.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Parse and clamp pagination query parameters.
 */
export function parsePagination(
  pageRaw?: string,
  limitRaw?: string,
  maxLimit = 100,
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(pageRaw ?? '1', 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(limitRaw ?? '20', 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
