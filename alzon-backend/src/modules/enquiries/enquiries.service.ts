import { prisma } from '../../config/database';
import { badRequest, forbidden, notFound } from '../../middleware/error.middleware';
import { parsePagination, buildPaginationMeta } from '../../utils/response';
import type { CreateEnquiryInput, UpdateEnquiryStatusInput } from './enquiries.schema';

export async function createEnquiryService(
  buyerUserId: string,
  input: CreateEnquiryInput,
) {
  const buyer = await prisma.buyerProfile.findUnique({
    where: { userId: buyerUserId },
  });

  if (!buyer) {
    throw forbidden('Buyer profile required to submit enquiry');
  }

  const supplier = await prisma.supplierProfile.findUnique({
    where: { id: input.supplierId },
  });

  if (!supplier || !supplier.isActive) {
    throw notFound('Supplier not found or inactive');
  }

  // Prevent supplier from submitting enquiry to themselves
  if (supplier.userId === buyerUserId) {
    throw badRequest('Suppliers cannot send enquiries to themselves');
  }

  let product = null;
  if (input.productId) {
    product = await prisma.product.findUnique({
      where: { id: input.productId },
    });

    if (!product || product.supplierId !== supplier.id) {
      throw badRequest('Product does not belong to the target supplier');
    }

    if (product.status !== 'APPROVED' || !product.isActive) {
      throw badRequest('Cannot send enquiry for non-approved or inactive product');
    }
  }

  const enquiry = await prisma.enquiry.create({
    data: {
      buyerId: buyer.id,
      supplierId: supplier.id,
      productId: input.productId || null,
      quantity: input.quantity,
      deliveryLocation: input.deliveryLocation,
      expectedDeliveryDate: input.expectedDeliveryDate
        ? new Date(input.expectedDeliveryDate)
        : null,
      additionalRequirement: input.additionalRequirement,
      status: 'NEW',
    },
    include: {
      product: { select: { id: true, name: true, slug: true } },
      supplier: { select: { id: true, businessName: true } },
      buyer: { select: { id: true, fullName: true, businessName: true } },
    },
  });

  // Increment product enquiryCount if applicable
  if (input.productId) {
    await prisma.product.update({
      where: { id: input.productId },
      data: { enquiryCount: { increment: 1 } },
    });
  }

  // Create notification for supplier user
  await prisma.notification.create({
    data: {
      userId: supplier.userId,
      type: 'ENQUIRY_RECEIVED',
      title: 'New Enquiry Received',
      message: `${buyer.fullName} sent an enquiry for ${
        product ? product.name : 'your products'
      }`,
      metadata: { enquiryId: enquiry.id },
    },
  });

  return enquiry;
}

export async function getBuyerEnquiriesService(
  buyerUserId: string,
  pageRaw?: string,
  limitRaw?: string,
) {
  const buyer = await prisma.buyerProfile.findUnique({
    where: { userId: buyerUserId },
  });

  if (!buyer) throw forbidden('Buyer profile required');

  const { page, limit, skip } = parsePagination(pageRaw, limitRaw);

  const [total, enquiries] = await Promise.all([
    prisma.enquiry.count({ where: { buyerId: buyer.id } }),
    prisma.enquiry.findMany({
      where: { buyerId: buyer.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: {
            id: true,
            slug: true,
            businessName: true,
            city: true,
            state: true,
            verificationStatus: true,
          },
        },
        product: { select: { id: true, name: true, slug: true, priceMin: true, priceMax: true } },
      },
    }),
  ]);

  return { enquiries, meta: buildPaginationMeta(total, page, limit) };
}

export async function getSupplierEnquiriesService(
  supplierUserId: string,
  pageRaw?: string,
  limitRaw?: string,
) {
  const supplier = await prisma.supplierProfile.findUnique({
    where: { userId: supplierUserId },
  });

  if (!supplier) throw forbidden('Supplier profile required');

  const { page, limit, skip } = parsePagination(pageRaw, limitRaw);

  const [total, enquiries] = await Promise.all([
    prisma.enquiry.count({ where: { supplierId: supplier.id } }),
    prisma.enquiry.findMany({
      where: { supplierId: supplier.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: {
          select: {
            id: true,
            fullName: true,
            businessName: true,
            city: true,
            state: true,
            phone: true,
            email: true,
          },
        },
        product: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  return { enquiries, meta: buildPaginationMeta(total, page, limit) };
}

export async function updateEnquiryStatusService(
  userId: string,
  role: string,
  enquiryId: string,
  input: UpdateEnquiryStatusInput,
) {
  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    include: {
      supplier: { select: { userId: true, businessName: true } },
      buyer: { select: { userId: true } },
      product: { select: { name: true } },
    },
  });

  if (!enquiry) throw notFound('Enquiry not found');

  // Supplier can update status of own enquiry; Admin can update any
  if (role === 'SUPPLIER' && enquiry.supplier.userId !== userId) {
    throw forbidden('Access denied');
  }

  const updated = await prisma.enquiry.update({
    where: { id: enquiryId },
    data: {
      status: input.status,
      supplierNote: input.supplierNote,
    },
  });

  // Notify buyer when status changes
  await prisma.notification.create({
    data: {
      userId: enquiry.buyer.userId,
      type: 'ENQUIRY_UPDATED',
      title: 'Enquiry Status Updated',
      message: `${enquiry.supplier.businessName} updated your enquiry status to "${input.status}"`,
      metadata: { enquiryId: enquiry.id },
    },
  });

  return updated;
}
