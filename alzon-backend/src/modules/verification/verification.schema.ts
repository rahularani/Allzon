import { z } from 'zod';
import { DocumentType, VerificationStatus } from '@prisma/client';

export const uploadDocumentBodySchema = z.object({
  documentType: z.nativeEnum(DocumentType),
});

export const reviewVerificationSchema = z.object({
  status: z.nativeEnum(VerificationStatus),
  reviewNote: z.string().optional(),
});

export type UploadDocumentBodyInput = z.infer<typeof uploadDocumentBodySchema>;
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;
