import { prisma } from '../../config/database';
import { conflict, forbidden, notFound } from '../../middleware/error.middleware';
import type { AddWishlistItemInput } from './wishlist.schema';

export async function addWishlistItemService(
  buyerUserId: string,
  input: AddWishlistItemInput,
) {
  const buyer = await prisma.buyerProfile.findUnique({
    where: { userId: buyerUserId },
  });

  if (!buyer) throw forbidden('Buyer profile required');

  if (input.itemType === 'PRODUCT' && input.productId) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product || !product.isActive) throw notFound('Product not found');

    const existing = await prisma.wishlistItem.findUnique({
      where: { buyerId_productId: { buyerId: buyer.id, productId: input.productId } },
    });
    if (existing) throw conflict('Product already in wishlist');

    return prisma.wishlistItem.create({
      data: {
        buyerId: buyer.id,
        itemType: 'PRODUCT',
        productId: input.productId,
      },
      include: { product: true },
    });
  } else if (input.itemType === 'SUPPLIER' && input.supplierId) {
    const supplier = await prisma.supplierProfile.findUnique({
      where: { id: input.supplierId },
    });
    if (!supplier || !supplier.isActive) throw notFound('Supplier not found');

    const existing = await prisma.wishlistItem.findUnique({
      where: { buyerId_supplierId: { buyerId: buyer.id, supplierId: input.supplierId } },
    });
    if (existing) throw conflict('Supplier already saved');

    return prisma.wishlistItem.create({
      data: {
        buyerId: buyer.id,
        itemType: 'SUPPLIER',
        supplierId: input.supplierId,
      },
      include: { supplier: true },
    });
  }

  throw notFound('Invalid wishlist item configuration');
}

export async function getBuyerWishlistService(buyerUserId: string) {
  const buyer = await prisma.buyerProfile.findUnique({
    where: { userId: buyerUserId },
  });

  if (!buyer) throw forbidden('Buyer profile required');

  const items = await prisma.wishlistItem.findMany({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          priceMin: true,
          priceMax: true,
          moq: true,
          images: { take: 1, select: { url: true } },
        },
      },
      supplier: {
        select: {
          id: true,
          slug: true,
          businessName: true,
          city: true,
          state: true,
          logoUrl: true,
          verificationStatus: true,
        },
      },
    },
  });

  return items;
}

export async function removeWishlistItemService(buyerUserId: string, id: string) {
  const buyer = await prisma.buyerProfile.findUnique({
    where: { userId: buyerUserId },
  });

  if (!buyer) throw forbidden('Buyer profile required');

  const item = await prisma.wishlistItem.findUnique({
    where: { id },
  });

  if (!item || item.buyerId !== buyer.id) {
    throw notFound('Wishlist item not found');
  }

  await prisma.wishlistItem.delete({ where: { id } });

  return { message: 'Item removed from wishlist' };
}
