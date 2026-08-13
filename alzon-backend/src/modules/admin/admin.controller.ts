import { Request, Response, NextFunction } from 'express';
import {
  getDashboardStatsService,
  listUsersService,
  toggleUserStatusService,
  listAdminProductsService,
  reviewProductService,
} from './admin.service';
import { listAuditLogsService } from '../audit/audit.service';
import { sendSuccess } from '../../utils/response';

export async function getDashboardStatsHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await getDashboardStatsService();
    sendSuccess(res, stats, 'Dashboard stats fetched');
  } catch (err) {
    next(err);
  }
}

export async function listUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit, role } = req.query;
    const { users, meta } = await listUsersService(
      page ? String(page) : undefined,
      limit ? String(limit) : undefined,
      role ? String(role) : undefined,
    );
    sendSuccess(res, users, 'Users fetched', 200, meta);
  } catch (err) {
    next(err);
  }
}

export async function suspendUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const updated = await toggleUserStatusService(req.user!.id, id, false);
    sendSuccess(res, updated, 'User account suspended');
  } catch (err) {
    next(err);
  }
}

export async function activateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const updated = await toggleUserStatusService(req.user!.id, id, true);
    sendSuccess(res, updated, 'User account activated');
  } catch (err) {
    next(err);
  }
}

export async function listAdminProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { status, page, limit } = req.query;
    const { products, meta } = await listAdminProductsService(
      status ? String(status) : undefined,
      page ? String(page) : undefined,
      limit ? String(limit) : undefined,
    );
    sendSuccess(res, products, 'Products fetched', 200, meta);
  } catch (err) {
    next(err);
  }
}

export async function reviewProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const updated = await reviewProductService(
      req.user!.id,
      id,
      req.body,
    );
    sendSuccess(res, updated, 'Product review recorded');
  } catch (err) {
    next(err);
  }
}

export async function listAuditLogsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit } = req.query;
    const { logs, meta } = await listAuditLogsService(
      page ? String(page) : undefined,
      limit ? String(limit) : undefined,
    );
    sendSuccess(res, logs, 'Audit logs fetched', 200, meta);
  } catch (err) {
    next(err);
  }
}
