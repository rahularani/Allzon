import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { requireSupplier } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { uploadSingleImage } from '../../middleware/upload.middleware';
import {
  createSupplierProfileSchema,
  updateSupplierProfileSchema,
  supplierSearchQuerySchema,
} from './suppliers.schema';
import {
  createSupplierProfileHandler,
  getOwnSupplierProfileHandler,
  getPublicSupplierProfileHandler,
  updateSupplierProfileHandler,
  uploadSupplierLogoHandler,
  listSuppliersHandler,
} from './suppliers.controller';

const router = Router();

// Public supplier routes
router.get(
  '/',
  optionalAuthenticate,
  validate(supplierSearchQuerySchema, 'query'),
  listSuppliersHandler,
);

router.get('/:idOrSlug', optionalAuthenticate, getPublicSupplierProfileHandler);

// Protected supplier profile routes
router.post(
  '/profile',
  authenticate,
  requireSupplier,
  validate(createSupplierProfileSchema),
  createSupplierProfileHandler,
);

router.get('/profile/me', authenticate, requireSupplier, getOwnSupplierProfileHandler);

router.put(
  '/profile',
  authenticate,
  requireSupplier,
  validate(updateSupplierProfileSchema),
  updateSupplierProfileHandler,
);

router.post(
  '/profile/logo',
  authenticate,
  requireSupplier,
  uploadSingleImage,
  uploadSupplierLogoHandler,
);

export default router;
