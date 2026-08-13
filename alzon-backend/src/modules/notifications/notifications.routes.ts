import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  getUserNotificationsHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
} from './notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', getUserNotificationsHandler);
router.put('/read-all', markAllNotificationsReadHandler);
router.put('/:id/read', markNotificationReadHandler);

export default router;
