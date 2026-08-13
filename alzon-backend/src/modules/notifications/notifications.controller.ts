import { Request, Response, NextFunction } from 'express';
import {
  getUserNotificationsService,
  markNotificationReadService,
  markAllNotificationsReadService,
} from './notifications.service';
import { sendSuccess } from '../../utils/response';

export async function getUserNotificationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getUserNotificationsService(req.user!.id);
    sendSuccess(res, data, 'Notifications fetched');
  } catch (err) {
    next(err);
  }
}

export async function markNotificationReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const updated = await markNotificationReadService(req.user!.id, id);
    sendSuccess(res, updated, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsReadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await markAllNotificationsReadService(req.user!.id);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}
