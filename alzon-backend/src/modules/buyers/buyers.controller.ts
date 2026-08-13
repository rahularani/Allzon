import { Request, Response, NextFunction } from 'express';
import {
  createBuyerProfileService,
  getBuyerProfileService,
  updateBuyerProfileService,
} from './buyers.service';
import { sendSuccess } from '../../utils/response';

export async function createBuyerProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await createBuyerProfileService(req.user!.id, req.body);
    sendSuccess(res, profile, 'Buyer profile created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getBuyerProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await getBuyerProfileService(req.user!.id);
    sendSuccess(res, profile, 'Buyer profile fetched successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateBuyerProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await updateBuyerProfileService(req.user!.id, req.body);
    sendSuccess(res, profile, 'Buyer profile updated successfully');
  } catch (err) {
    next(err);
  }
}
