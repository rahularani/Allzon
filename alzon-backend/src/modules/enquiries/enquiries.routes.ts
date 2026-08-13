import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBuyer, requireSupplier } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createEnquirySchema,
  updateEnquiryStatusSchema,
} from './enquiries.schema';
import {
  createEnquiryHandler,
  getBuyerEnquiriesHandler,
  getSupplierEnquiriesHandler,
  updateEnquiryStatusHandler,
} from './enquiries.controller';

const router = Router();

router.use(authenticate);

// POST /api/v1/enquiries — Buyer submits enquiry
router.post(
  '/',
  requireBuyer,
  validate(createEnquirySchema),
  createEnquiryHandler,
);

// GET /api/v1/buyer/enquiries — Buyer views own enquiries
router.get('/buyer/mine', requireBuyer, getBuyerEnquiriesHandler);

// GET /api/v1/supplier/enquiries — Supplier views received enquiries
router.get('/supplier/received', requireSupplier, getSupplierEnquiriesHandler);

// PUT /api/v1/supplier/enquiries/:id/status — Supplier updates status
router.put(
  '/:id/status',
  requireSupplier,
  validate(updateEnquiryStatusSchema),
  updateEnquiryStatusHandler,
);

export default router;
