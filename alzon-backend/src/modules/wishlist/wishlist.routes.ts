import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireBuyer } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { addWishlistItemSchema } from './wishlist.schema';
import {
  addWishlistItemHandler,
  getBuyerWishlistHandler,
  removeWishlistItemHandler,
} from './wishlist.controller';

const router = Router();

router.use(authenticate, requireBuyer);

router.get('/', getBuyerWishlistHandler);
router.post('/', validate(addWishlistItemSchema), addWishlistItemHandler);
router.delete('/:id', removeWishlistItemHandler);

export default router;
