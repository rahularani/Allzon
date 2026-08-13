import { prisma } from '../../config/database';
import { badRequest, forbidden, notFound } from '../../middleware/error.middleware';
import { uploadToCloudinary } from '../../config/cloudinary';
import type { UploadDocumentBodyInput, ReviewVerificationInput } from './verification.schema';

export async function uploadVerificationDocumentService(
  supplierUserId: string,
  input: UploadDocumentBodyInput,
  file: Express.Multer.File,
) {
  const supplier = await prisma.supplierProfile.findUnique({
    where: { userId: supplierUserId },
  });

  if (!supplier) throw forbidden('Supplier profile required');

  const isPdf = file.mimetype === 'application/pdf';
  const resourceType = isPdf ? 'raw' : 'image';

  // Private Cloudinary upload — URL is restricted
  const uploadResult = await uploadToCloudinary(
    file.buffer,
    'verification',
    resourceType,
    true, // isPrivate
  );

  const document = await prisma.verificationDocument.create({
    data: {
      supplierId: supplier.id,
      documentType: input.documentType || 'GST_CERTIFICATE',
      cloudinaryId: uploadResult.public_id,
      url: uploadResult.secure_url,
      fileName: file.originalname,
      status: 'PENDING',
    },
  });

  // Update supplier profile verification status to UNDER_REVIEW
  if (supplier.verificationStatus === 'PENDING' || supplier.verificationStatus === 'MORE_INFO_REQUIRED') {
    await prisma.supplierProfile.update({
      where: { id: supplier.id },
      data: { verificationStatus: 'UNDER_REVIEW' },
    });
  }

  return document;
}

export async function getSupplierVerificationStatusService(supplierUserId: string) {
  const supplier = await prisma.supplierProfile.findUnique({
    where: { userId: supplierUserId },
    select: {
      id: true,
      businessName: true,
      verificationStatus: true,
      verificationDocs: {
        select: {
          id: true,
          documentType: true,
          status: true,
          fileName: true,
          reviewNote: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!supplier) throw forbidden('Supplier profile required');
  return supplier;
}

export async function getVerificationQueueService() {
  const queue = await prisma.supplierProfile.findMany({
    where: {
      verificationStatus: { in: ['PENDING', 'UNDER_REVIEW', 'MORE_INFO_REQUIRED'] },
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      businessName: true,
      businessType: true,
      ownerName: true,
      phone: true,
      email: true,
      gstNumber: true,
      panNumber: true,
      city: true,
      state: true,
      verificationStatus: true,
      createdAt: true,
      updatedAt: true,
      verificationDocs: {
        select: {
          id: true,
          documentType: true,
          status: true,
          fileName: true,
          url: true,
          createdAt: true,
        },
      },
    },
  });

  return queue;
}

export async function reviewSupplierVerificationService(
  adminUserId: string,
  supplierId: string,
  input: ReviewVerificationInput,
) {
  const supplier = await prisma.supplierProfile.findUnique({
    where: { id: supplierId },
  });

  if (!supplier) throw notFound('Supplier not found');

  const updated = await prisma.supplierProfile.update({
    where: { id: supplierId },
    data: { verificationStatus: input.status },
  });

  // Update associated pending documents
  await prisma.verificationDocument.updateMany({
    where: { supplierId, status: 'PENDING' },
    data: {
      status: input.status,
      reviewedAt: new Date(),
      reviewedBy: adminUserId,
      reviewNote: input.reviewNote,
    },
  });

  // Create notification for supplier
  let title = 'Verification Status Update';
  let message = `Your verification status has been updated to "${input.status}"`;
  if (input.status === 'VERIFIED') {
    title = '🎉 Business Verified!';
    message = 'Congratulations! Your business verification has been approved.';
  } else if (input.status === 'REJECTED') {
    title = 'Verification Rejected';
    message = `Your verification request was rejected. Reason: ${input.reviewNote || 'Incomplete documents'}`;
  } else if (input.status === 'MORE_INFO_REQUIRED') {
    title = 'More Verification Info Required';
    message = `Additional information is required: ${input.reviewNote || 'Please re-upload clear documents'}`;
  }

  await prisma.notification.create({
    data: {
      userId: supplier.userId,
      type: input.status === 'VERIFIED' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      title,
      message,
    },
  });

  // Create Audit Log entry
  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: 'VERIFICATION_REVIEWED',
      entity: 'SupplierProfile',
      entityId: supplierId,
      metadata: { status: input.status, reviewNote: input.reviewNote },
    },
  });

  return updated;
}
