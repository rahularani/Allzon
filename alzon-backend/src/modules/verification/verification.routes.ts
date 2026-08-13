import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireSupplier, requireAdminOrStaff } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { uploadDocument } from '../../middleware/upload.middleware';
import {
  uploadDocumentBodySchema,
  reviewVerificationSchema,
} from './verification.schema';
import {
  uploadVerificationDocumentHandler,
  getSupplierVerificationStatusHandler,
  getVerificationQueueHandler,
  reviewSupplierVerificationHandler,
} from './verification.controller';

const router = Router();

router.use(authenticate);

// Supplier routes
router.post(
  '/documents',
  requireSupplier,
  uploadDocument,
  validate(uploadDocumentBodySchema),
  uploadVerificationDocumentHandler,
);

router.get('/status', requireSupplier, getSupplierVerificationStatusHandler);

// Admin & Verification Staff shared review routes
router.get('/queue', requireAdminOrStaff, getVerificationQueueHandler);

router.put(
  '/:id/review',
  requireAdminOrStaff,
  validate(reviewVerificationSchema),
  reviewSupplierVerificationHandler,
);

export default router;
