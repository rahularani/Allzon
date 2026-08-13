import { Request, Response, NextFunction } from 'express';
import {
  addWishlistItemService,
  getBuyerWishlistService,
  removeWishlistItemService,
} from './wishlist.service';
import { sendSuccess } from '../../utils/response';

export async function addWishlistItemHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const item = await addWishlistItemService(req.user!.id, req.body);
    sendSuccess(res, item, 'Item added to wishlist', 201);
  } catch (err) {
    next(err);
  }
}

export async function getBuyerWishlistHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const items = await getBuyerWishlistService(req.user!.id);
    sendSuccess(res, items, 'Wishlist items fetched');
  } catch (err) {
    next(err);
  }
}

export async function removeWishlistItemHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const result = await removeWishlistItemService(req.user!.id, id);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}
