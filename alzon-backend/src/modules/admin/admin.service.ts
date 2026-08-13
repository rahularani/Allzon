import { prisma } from '../../config/database';
import { notFound } from '../../middleware/error.middleware';
import { parsePagination, buildPaginationMeta } from '../../utils/response';
import { createAuditLogService } from '../audit/audit.service';
import type { ReviewProductInput } from './admin.schema';

export async function getDashboardStatsService() {
  const [
    totalUsers,
    totalBuyers,
    totalSuppliers,
    verifiedSuppliers,
    pendingVerifications,
    totalProducts,
    pendingProducts,
    totalEnquiries,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.buyerProfile.count(),
    prisma.supplierProfile.count(),
    prisma.supplierProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.supplierProfile.count({
      where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { status: 'PENDING', isActive: true } }),
    prisma.enquiry.count(),
  ]);

  return {
    totalUsers,
    totalBuyers,
    totalSuppliers,
    verifiedSuppliers,
    pendingVerifications,
    totalProducts,
    pendingProducts,
    totalEnquiries,
  };
}

export async function listUsersService(pageRaw?: string, limitRaw?: string, roleFilter?: string) {
  const { page, limit, skip } = parsePagination(pageRaw, limitRaw);

  const where: any = {};
  if (roleFilter) where.role = roleFilter;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        buyerProfile: { select: { fullName: true, businessName: true } },
        supplierProfile: { select: { businessName: true, verificationStatus: true } },
      },
    }),
  ]);

  return { users, meta: buildPaginationMeta(total, page, limit) };
}

export async function toggleUserStatusService(adminUserId: string, userId: string, activate: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: activate },
  });

  await createAuditLogService({
    userId: adminUserId,
    action: activate ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
    entity: 'User',
    entityId: userId,
  });

  return updated;
}

export async function listAdminProductsService(
  statusFilter?: string,
  pageRaw?: string,
  limitRaw?: string,
) {
  const { page, limit, skip } = parsePagination(pageRaw, limitRaw);
  const where: any = { isActive: true };
  if (statusFilter) where.status = statusFilter;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        supplier: { select: { id: true, businessName: true, verificationStatus: true } },
        images: { take: 1, select: { url: true } },
      },
    }),
  ]);

  return { products, meta: buildPaginationMeta(total, page, limit) };
}

export async function reviewProductService(
  actorUserId: string,
  productId: string,
  input: ReviewProductInput,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { supplier: true },
  });

  if (!product) throw notFound('Product not found');

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      status: input.status,
      rejectionReason: input.rejectionReason,
    },
  });

  // Notify supplier
  await prisma.notification.create({
    data: {
      userId: product.supplier.userId,
      type: input.status === 'APPROVED' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
      title: input.status === 'APPROVED' ? 'Product Approved! 🎉' : 'Product Listing Rejected',
      message:
        input.status === 'APPROVED'
          ? `Your product "${product.name}" has been approved and is live.`
          : `Your product "${product.name}" was rejected. Reason: ${
              input.rejectionReason || 'Does not meet guidelines'
            }`,
      metadata: { productId: product.id },
    },
  });

  // Audit log
  await createAuditLogService({
    userId: actorUserId,
    action: input.status === 'APPROVED' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
    entity: 'Product',
    entityId: productId,
    metadata: { status: input.status, rejectionReason: input.rejectionReason },
  });

  return updated;
}
