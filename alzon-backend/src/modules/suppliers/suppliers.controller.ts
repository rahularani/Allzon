import { Request, Response, NextFunction } from 'express';
import {
  createSupplierProfileService,
  getOwnSupplierProfileService,
  getPublicSupplierProfileService,
  updateSupplierProfileService,
  uploadSupplierLogoService,
  listSuppliersService,
} from './suppliers.service';
import { sendSuccess } from '../../utils/response';
import { badRequest } from '../../middleware/error.middleware';

export async function createSupplierProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await createSupplierProfileService(req.user!.id, req.body);
    sendSuccess(res, profile, 'Supplier profile created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getOwnSupplierProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await getOwnSupplierProfileService(req.user!.id);
    sendSuccess(res, profile, 'Supplier profile fetched');
  } catch (err) {
    next(err);
  }
}

export async function getPublicSupplierProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idOrSlug = req.params.idOrSlug as string;
    const profile = await getPublicSupplierProfileService(idOrSlug);
    sendSuccess(res, profile, 'Public supplier profile fetched');
  } catch (err) {
    next(err);
  }
}

export async function updateSupplierProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const profile = await updateSupplierProfileService(req.user!.id, req.body);
    sendSuccess(res, profile, 'Supplier profile updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function uploadSupplierLogoHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      throw badRequest('Image file is required');
    }
    const profile = await uploadSupplierLogoService(req.user!.id, req.file);
    sendSuccess(res, profile, 'Logo uploaded successfully');
  } catch (err) {
    next(err);
  }
}

export async function listSuppliersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { suppliers, meta } = await listSuppliersService(req.query as any);
    sendSuccess(res, suppliers, 'Suppliers listed successfully', 200, meta);
  } catch (err) {
    next(err);
  }
}
