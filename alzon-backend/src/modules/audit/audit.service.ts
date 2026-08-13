import { prisma } from '../../config/database';
import { parsePagination, buildPaginationMeta } from '../../utils/response';
import { AuditAction } from '@prisma/client';

export async function createAuditLogService(params: {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
    },
  });
}

export async function listAuditLogsService(pageRaw?: string, limitRaw?: string) {
  const { page, limit, skip } = parsePagination(pageRaw, limitRaw);

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, phone: true, role: true } },
      },
    }),
  ]);

  return { logs, meta: buildPaginationMeta(total, page, limit) };
}
