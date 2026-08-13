import { z } from 'zod';
import { BusinessType } from '@prisma/client';

export const createSupplierProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessType: z.nativeEnum(BusinessType),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
});

export const updateSupplierProfileSchema = createSupplierProfileSchema.partial();

export const supplierSearchQuerySchema = z.object({
  q: z.string().optional(),
  type: z.nativeEnum(BusinessType).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  verified: z.enum(['true', 'false']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateSupplierProfileInput = z.infer<typeof createSupplierProfileSchema>;
export type UpdateSupplierProfileInput = z.infer<typeof updateSupplierProfileSchema>;
export type SupplierSearchQuery = z.infer<typeof supplierSearchQuerySchema>;
