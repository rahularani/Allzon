import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createSubcategorySchema = z.object({
  name: z.string().min(2, 'Subcategory name must be at least 2 characters'),
  displayOrder: z.number().int().optional(),
});

export const updateSubcategorySchema = createSubcategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>;
