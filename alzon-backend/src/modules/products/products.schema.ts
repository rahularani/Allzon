import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  subcategoryId: z.string().uuid('Invalid subcategory ID').optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  priceUnit: z.string().optional(),
  moq: z.number().int().positive().optional(),
  moqUnit: z.string().optional(),
  availableQty: z.number().int().nonnegative().optional(),
  supplyAbility: z.string().optional(),
  deliveryTime: z.string().optional(),
  paymentTerms: z.string().optional(),
  brand: z.string().optional(),
  modelNumber: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  packagingDetails: z.string().optional(),
  gstPercent: z.number().nonnegative().optional(),
  location: z.string().optional(),
  specifications: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string().min(1),
      }),
    )
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productSearchQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  location: z.string().optional(),
  state: z.string().optional(),
  supplierType: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  minMOQ: z.string().optional(),
  maxMOQ: z.string().optional(),
  verified: z.enum(['true', 'false']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort: z
    .enum(['relevance', 'price_asc', 'price_desc', 'moq_asc', 'rating', 'newest'])
    .optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductSearchQuery = z.infer<typeof productSearchQuerySchema>;
