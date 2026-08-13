import { prisma } from '../../config/database';
import { badRequest, forbidden, notFound } from '../../middleware/error.middleware';
import { generateProductSlug } from '../../utils/slug';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import type { CreateProductInput, UpdateProductInput } from './products.schema';

export async function createProductService(
  supplierUserId: string,
  input: CreateProductInput,
) {
  const supplier = await prisma.supplierProfile.findUnique({
    where: { userId: supplierUserId },
  });

  if (!supplier) {
    throw forbidden('Only registered suppliers with a profile can create products');
  }

  const slug = await generateProductSlug(input.name);

  const product = await prisma.product.create({
    data: {
      supplierId: supplier.id,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId,
      name: input.name,
      slug,
      description: input.description,
      priceMin: input.priceMin,
      priceMax: input.priceMax,
      priceUnit: input.priceUnit,
      moq: input.moq,
      moqUnit: input.moqUnit,
      availableQty: input.availableQty,
      supplyAbility: input.supplyAbility,
      deliveryTime: input.deliveryTime,
      paymentTerms: input.paymentTerms,
      brand: input.brand,
      modelNumber: input.modelNumber,
      material: input.material,
      color: input.color,
      size: input.size,
      packagingDetails: input.packagingDetails,
      gstPercent: input.gstPercent,
      location: input.location || `${supplier.city ?? ''}, ${supplier.state ?? ''}`.trim(),
      status: 'PENDING',
      specifications: input.specifications
        ? {
            createMany: {
              data: input.specifications,
            },
          }
        : undefined,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      specifications: true,
    },
  });

  // Increment product count on supplier
  await prisma.supplierProfile.update({
    where: { id: supplier.id },
    data: { productCount: { increment: 1 } },
  });

  return product;
}

export async function getProductByIdOrSlugService(idOrSlug: string, isOwnerOrAdmin = false) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      ...(isOwnerOrAdmin ? {} : { status: 'APPROVED', isActive: true }),
    },
    include: {
      category: true,
      subcategory: true,
      supplier: {
        select: {
          id: true,
          slug: true,
          businessName: true,
          businessType: true,
          city: true,
          state: true,
          verificationStatus: true,
          rating: true,
          responseRate: true,
          logoUrl: true,
        },
      },
      images: { orderBy: { displayOrder: 'asc' } },
      specifications: true,
    },
  });

  if (!product) {
    throw notFound('Product not found');
  }

  // Increment view count asynchronously
  if (!isOwnerOrAdmin) {
    prisma.product
      .update({
        where: { id: product.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});
  }

  return product;
}

export async function updateProductService(
  supplierUserId: string,
  productId: string,
  input: UpdateProductInput,
) {
  const supplier = await prisma.supplierProfile.findUnique({
    where: { userId: supplierUserId },
  });

  if (!supplier) throw forbidden('Supplier profile not found');

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.supplierId !== supplier.id) {
    throw notFound('Product not found or access denied');
  }

  let slug = product.slug;
  if (input.name && input.name !== product.name) {
    slug = await generateProductSlug(input.name, product.id);
  }

  // Specifications update: delete old and recreate if provided
  if (input.specifications) {
    await prisma.productSpecification.deleteMany({
      where: { productId },
    });
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...input,
      slug,
      status: 'PENDING', // Re-trigger moderation on update
      specifications: input.specifications
        ? {
            createMany: { data: input.specifications },
          }
        : undefined,
    },
    include: {
      specifications: true,
    },
  });

  return updated;
}

export async function deleteProductService(supplierUserId: string, productId: string) {
  const supplier = await prisma.supplierProfile.findUnique({
    where: { userId: supplierUserId },
  });

  if (!supplier) throw forbidden('Supplier profile not found');

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.supplierId !== supplier.id) {
    throw notFound('Product not found');
  }

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });

  await prisma.supplierProfile.update({
    where: { id: supplier.id },
    data: { productCount: { decrement: 1 } },
  });

  return { message: 'Product deleted' };
}

export async function uploadProductImagesService(
  supplierUserId: string,
  productId: string,
  files: Express.Multer.File[],
) {
  const supplier = await prisma.supplierProfile.findUnique({
    where: { userId: supplierUserId },
  });

  if (!supplier) throw forbidden('Supplier profile not found');

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });

  if (!product || product.supplierId !== supplier.id) {
    throw notFound('Product not found');
  }

  if (product.images.length + files.length > 8) {
    throw badRequest('Maximum 8 images per product allowed');
  }

  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file.buffer, 'products', 'image'),
  );
  const results = await Promise.all(uploadPromises);

  const isFirstImage = product.images.length === 0;

  const imageRecords = await Promise.all(
    results.map((res, index) =>
      prisma.productImage.create({
        data: {
          productId,
          cloudinaryId: res.public_id,
          url: res.secure_url,
          isPrimary: isFirstImage && index === 0,
          displayOrder: product.images.length + index,
        },
      }),
    ),
  );

  return imageRecords;
}

export async function deleteProductImageService(
  supplierUserId: string,
  productId: string,
  imageId: string,
) {
  const supplier = await prisma.supplierProfile.findUnique({
    where: { userId: supplierUserId },
  });

  if (!supplier) throw forbidden('Supplier profile not found');

  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
    include: { product: true },
  });

  if (!image || image.product.supplierId !== supplier.id) {
    throw notFound('Product image not found');
  }

  await deleteFromCloudinary(image.cloudinaryId);
  await prisma.productImage.delete({ where: { id: imageId } });

  return { message: 'Image deleted' };
}

export async function getSupplierOwnProductsService(supplierUserId: string) {
  const supplier = await prisma.supplierProfile.findUnique({
    where: { userId: supplierUserId },
  });

  if (!supplier) throw forbidden('Supplier profile not found');

  const products = await prisma.product.findMany({
    where: { supplierId: supplier.id, isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  return products;
}
