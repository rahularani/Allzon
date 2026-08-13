import { z } from 'zod';
import { BusinessType } from '@prisma/client';

export const createBuyerProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  businessName: z.string().optional(),
  businessType: z.nativeEnum(BusinessType).optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export const updateBuyerProfileSchema = createBuyerProfileSchema.partial();

export type CreateBuyerProfileInput = z.infer<typeof createBuyerProfileSchema>;
export type UpdateBuyerProfileInput = z.infer<typeof updateBuyerProfileSchema>;
