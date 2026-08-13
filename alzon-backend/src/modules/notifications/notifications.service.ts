import { prisma } from '../../config/database';
import { notFound } from '../../middleware/error.middleware';

export async function getUserNotificationsService(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { notifications, unreadCount };
}

export async function markNotificationReadService(userId: string, notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw notFound('Notification not found');
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return updated;
}

export async function markAllNotificationsReadService(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { message: 'All notifications marked as read' };
}
