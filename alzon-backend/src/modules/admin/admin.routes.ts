import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin, requireAdminOrStaff } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { reviewProductSchema } from './admin.schema';
import {
  getDashboardStatsHandler,
  listUsersHandler,
  suspendUserHandler,
  activateUserHandler,
  listAdminProductsHandler,
  reviewProductHandler,
  listAuditLogsHandler,
} from './admin.controller';

const router = Router();

router.use(authenticate);

// ─── ADMIN-ONLY ROUTES ───────────────────────────────────────────────────────
router.get('/dashboard/stats', requireAdmin, getDashboardStatsHandler);
router.get('/users', requireAdmin, listUsersHandler);
router.put('/users/:id/suspend', requireAdmin, suspendUserHandler);
router.put('/users/:id/activate', requireAdmin, activateUserHandler);
router.get('/audit-logs', requireAdmin, listAuditLogsHandler);

// ─── ADMIN + VERIFICATION_STAFF SHARED ROUTES ────────────────────────────────
router.get('/products', requireAdminOrStaff, listAdminProductsHandler);
router.put(
  '/products/:id/review',
  requireAdminOrStaff,
  validate(reviewProductSchema),
  reviewProductHandler,
);

export default router;
