import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { requireSupplier } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { uploadMultipleImages } from '../../middleware/upload.middleware';
import {
  createProductSchema,
  updateProductSchema,
  productSearchQuerySchema,
} from './products.schema';
import {
  searchProductsHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  uploadProductImagesHandler,
  deleteProductImageHandler,
  getSupplierOwnProductsHandler,
} from './products.controller';

const router = Router();

// Public discovery routes
router.get(
  '/',
  optionalAuthenticate,
  validate(productSearchQuerySchema, 'query'),
  searchProductsHandler,
);

router.get('/:idOrSlug', optionalAuthenticate, getProductHandler);

// Supplier product actions (via /api/v1/supplier/products mount or direct)
router.get(
  '/supplier/mine',
  authenticate,
  requireSupplier,
  getSupplierOwnProductsHandler,
);

router.post(
  '/',
  authenticate,
  requireSupplier,
  validate(createProductSchema),
  createProductHandler,
);

router.put(
  '/:id',
  authenticate,
  requireSupplier,
  validate(updateProductSchema),
  updateProductHandler,
);

router.delete('/:id', authenticate, requireSupplier, deleteProductHandler);

router.post(
  '/:id/images',
  authenticate,
  requireSupplier,
  uploadMultipleImages,
  uploadProductImagesHandler,
);

router.delete(
  '/:id/images/:imgId',
  authenticate,
  requireSupplier,
  deleteProductImageHandler,
);

export default router;
