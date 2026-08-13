import { Request, Response, NextFunction } from 'express';
import {
  createEnquiryService,
  getBuyerEnquiriesService,
  getSupplierEnquiriesService,
  updateEnquiryStatusService,
} from './enquiries.service';
import { sendSuccess } from '../../utils/response';

export async function createEnquiryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const enquiry = await createEnquiryService(req.user!.id, req.body);
    sendSuccess(res, enquiry, 'Enquiry submitted successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getBuyerEnquiriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit } = req.query;
    const { enquiries, meta } = await getBuyerEnquiriesService(
      req.user!.id,
      page ? String(page) : undefined,
      limit ? String(limit) : undefined,
    );
    sendSuccess(res, enquiries, 'Enquiries fetched', 200, meta);
  } catch (err) {
    next(err);
  }
}

export async function getSupplierEnquiriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page, limit } = req.query;
    const { enquiries, meta } = await getSupplierEnquiriesService(
      req.user!.id,
      page ? String(page) : undefined,
      limit ? String(limit) : undefined,
    );
    sendSuccess(res, enquiries, 'Received enquiries fetched', 200, meta);
  } catch (err) {
    next(err);
  }
}

export async function updateEnquiryStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const updated = await updateEnquiryStatusService(
      req.user!.id,
      req.user!.role,
      id,
      req.body,
    );
    sendSuccess(res, updated, 'Enquiry status updated successfully');
  } catch (err) {
    next(err);
  }
}
