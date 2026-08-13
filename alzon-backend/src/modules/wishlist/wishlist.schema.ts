import { z } from 'zod';
import { WishlistItemType } from '@prisma/client';

export const addWishlistItemSchema = z
  .object({
    itemType: z.nativeEnum(WishlistItemType),
    productId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
  })
  .refine(
    (data) =>
      (data.itemType === 'PRODUCT' && data.productId && !data.supplierId) ||
      (data.itemType === 'SUPPLIER' && data.supplierId && !data.productId),
    {
      message:
        'Must provide productId when itemType is PRODUCT, or supplierId when itemType is SUPPLIER',
    },
  );

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
