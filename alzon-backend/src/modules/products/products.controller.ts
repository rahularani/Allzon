import { Request, Response, NextFunction } from 'express';
import {
  createProductService,
  getProductByIdOrSlugService,
  updateProductService,
  deleteProductService,
  uploadProductImagesService,
  deleteProductImageService,
  getSupplierOwnProductsService,
} from './products.service';
import { searchService } from './search.service';
import { sendSuccess } from '../../utils/response';
import { badRequest } from '../../middleware/error.middleware';

export async function searchProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { products, meta } = await searchService.searchProducts(req.query as any);
    sendSuccess(res, products, 'Products retrieved successfully', 200, meta);
  } catch (err) {
    next(err);
  }
}

export async function getProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idOrSlug = req.params.idOrSlug as string;
    const isOwnerOrAdmin =
      req.user?.role === 'ADMIN' ||
      req.user?.role === 'VERIFICATION_STAFF' ||
      req.user?.role === 'SUPPLIER';
    const product = await getProductByIdOrSlugService(
      idOrSlug,
      isOwnerOrAdmin,
    );
    sendSuccess(res, product, 'Product details fetched');
  } catch (err) {
    next(err);
  }
}

export async function createProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await createProductService(req.user!.id, req.body);
    sendSuccess(res, product, 'Product created successfully and submitted for review', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const product = await updateProductService(
      req.user!.id,
      id,
      req.body,
    );
    sendSuccess(res, product, 'Product updated and resubmitted for review');
  } catch (err) {
    next(err);
  }
}

export async function deleteProductHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const result = await deleteProductService(req.user!.id, id);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

export async function uploadProductImagesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw badRequest('At least one image file is required');
    }
    const images = await uploadProductImagesService(
      req.user!.id,
      id,
      files,
    );
    sendSuccess(res, images, 'Images uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function deleteProductImageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const imgId = req.params.imgId as string;
    const result = await deleteProductImageService(
      req.user!.id,
      id,
      imgId,
    );
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

export async function getSupplierOwnProductsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const products = await getSupplierOwnProductsService(req.user!.id);
    sendSuccess(res, products, 'Own products fetched');
  } catch (err) {
    next(err);
  }
}
