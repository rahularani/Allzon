import { Request, Response, NextFunction } from 'express';
import {
  uploadVerificationDocumentService,
  getSupplierVerificationStatusService,
  getVerificationQueueService,
  reviewSupplierVerificationService,
} from './verification.service';
import { sendSuccess } from '../../utils/response';
import { badRequest } from '../../middleware/error.middleware';

export async function uploadVerificationDocumentHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) throw badRequest('Document file is required');
    const doc = await uploadVerificationDocumentService(
      req.user!.id,
      req.body,
      req.file,
    );
    sendSuccess(res, doc, 'Document uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getSupplierVerificationStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const status = await getSupplierVerificationStatusService(req.user!.id);
    sendSuccess(res, status, 'Verification status fetched');
  } catch (err) {
    next(err);
  }
}

export async function getVerificationQueueHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const queue = await getVerificationQueueService();
    sendSuccess(res, queue, 'Verification queue fetched');
  } catch (err) {
    next(err);
  }
}

export async function reviewSupplierVerificationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const updated = await reviewSupplierVerificationService(
      req.user!.id,
      id,
      req.body,
    );
    sendSuccess(res, updated, 'Supplier verification reviewed successfully');
  } catch (err) {
    next(err);
  }
}
