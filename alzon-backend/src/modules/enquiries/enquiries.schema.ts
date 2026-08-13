import { z } from 'zod';
import { EnquiryStatus } from '@prisma/client';

export const createEnquirySchema = z.object({
  supplierId: z.string().uuid('Invalid supplier ID'),
  productId: z.string().uuid('Invalid product ID').optional(),
  quantity: z.string().min(1, 'Quantity is required'),
  deliveryLocation: z.string().min(2, 'Delivery location is required'),
  expectedDeliveryDate: z.string().optional(),
  additionalRequirement: z.string().optional(),
});

export const updateEnquiryStatusSchema = z.object({
  status: z.nativeEnum(EnquiryStatus),
  supplierNote: z.string().optional(),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryStatusInput = z.infer<typeof updateEnquiryStatusSchema>;
