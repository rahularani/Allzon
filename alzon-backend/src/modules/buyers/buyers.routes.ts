import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBuyer } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createBuyerProfileSchema,
  updateBuyerProfileSchema,
} from './buyers.schema';
import {
  createBuyerProfileHandler,
  getBuyerProfileHandler,
  updateBuyerProfileHandler,
} from './buyers.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/profile',
  requireBuyer,
  validate(createBuyerProfileSchema),
  createBuyerProfileHandler,
);

router.get('/profile', requireBuyer, getBuyerProfileHandler);

router.put(
  '/profile',
  requireBuyer,
  validate(updateBuyerProfileSchema),
  updateBuyerProfileHandler,
);

export default router;
