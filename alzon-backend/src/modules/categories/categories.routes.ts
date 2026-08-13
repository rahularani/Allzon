import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  createSubcategorySchema,
  updateSubcategorySchema,
} from './categories.schema';
import {
  listCategoriesHandler,
  getCategoryHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  createSubcategoryHandler,
  updateSubcategoryHandler,
  deleteSubcategoryHandler,
} from './categories.controller';

const router = Router();

// Public routes
router.get('/', listCategoriesHandler);
router.get('/:idOrSlug', getCategoryHandler);

// Admin-only management routes (VERIFICATION_STAFF is excluded from managing categories)
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createCategorySchema),
  createCategoryHandler,
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(updateCategorySchema),
  updateCategoryHandler,
);

router.delete('/:id', authenticate, requireAdmin, deleteCategoryHandler);

router.post(
  '/:id/subcategories',
  authenticate,
  requireAdmin,
  validate(createSubcategorySchema),
  createSubcategoryHandler,
);

router.put(
  '/:catId/subcategories/:subId',
  authenticate,
  requireAdmin,
  validate(updateSubcategorySchema),
  updateSubcategoryHandler,
);

router.delete(
  '/:catId/subcategories/:subId',
  authenticate,
  requireAdmin,
  deleteSubcategoryHandler,
);

export default router;
