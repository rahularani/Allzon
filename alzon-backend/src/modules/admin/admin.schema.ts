import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

export const reviewProductSchema = z.object({
  status: z.nativeEnum(ProductStatus),
  rejectionReason: z.string().optional(),
});

export type ReviewProductInput = z.infer<typeof reviewProductSchema>;
