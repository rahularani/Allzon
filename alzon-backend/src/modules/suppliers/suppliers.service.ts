import { prisma } from '../../config/database';
import { conflict, notFound } from '../../middleware/error.middleware';
import { generateSupplierSlug } from '../../utils/slug';
import { parsePagination, buildPaginationMeta } from '../../utils/response';
import { uploadToCloudinary } from '../../config/cloudinary';
import type {
  CreateSupplierProfileInput,
  UpdateSupplierProfileInput,
  SupplierSearchQuery,
} from './suppliers.schema';

export async function createSupplierProfileService(
  userId: string,
  input: CreateSupplierProfileInput,
) {
  const existing = await prisma.supplierProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw conflict('Supplier profile already exists for this account');
  }

  const slug = await generateSupplierSlug(input.businessName);

  const profile = await prisma.supplierProfile.create({
    data: {
      userId,
      slug,
      businessName: input.businessName,
      businessType: input.businessType,
      ownerName: input.ownerName,
      phone: input.phone,
      email: input.email || null,
      gstNumber: input.gstNumber,
      panNumber: input.panNumber,
      yearEstablished: input.yearEstablished,
      description: input.description,
      address: input.address,
      state: input.state,
      district: input.district,
      city: input.city,
      pincode: input.pincode,
    },
  });

  return profile;
}

export async function getOwnSupplierProfileService(userId: string) {
  const profile = await prisma.supplierProfile.findUnique({
    where: { userId },
    include: {
      verificationDocs: {
        select: {
          id: true,
          documentType: true,
          status: true,
          fileName: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) {
    throw notFound('Supplier profile not found');
  }

  return profile;
}

export async function getPublicSupplierProfileService(idOrSlug: string) {
  const profile = await prisma.supplierProfile.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      isActive: true,
    },
    include: {
      products: {
        where: { status: 'APPROVED', isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          priceMin: true,
          priceMax: true,
          priceUnit: true,
          moq: true,
          moqUnit: true,
          images: {
            take: 1,
            select: { url: true, altText: true },
          },
        },
      },
    },
  });

  if (!profile) {
    throw notFound('Supplier not found');
  }

  return profile;
}

export async function updateSupplierProfileService(
  userId: string,
  input: UpdateSupplierProfileInput,
) {
  const profile = await prisma.supplierProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw notFound('Supplier profile not found');
  }

  let slug = profile.slug;
  if (input.businessName && input.businessName !== profile.businessName) {
    slug = await generateSupplierSlug(input.businessName, profile.id);
  }

  const updated = await prisma.supplierProfile.update({
    where: { userId },
    data: {
      ...input,
      slug,
      email: input.email === '' ? null : input.email,
    },
  });

  return updated;
}

export async function uploadSupplierLogoService(userId: string, file: Express.Multer.File) {
  const profile = await prisma.supplierProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw notFound('Supplier profile not found');
  }

  const result = await uploadToCloudinary(file.buffer, 'suppliers', 'image');

  const updated = await prisma.supplierProfile.update({
    where: { userId },
    data: { logoUrl: result.secure_url },
  });

  return updated;
}

export async function listSuppliersService(query: SupplierSearchQuery) {
  const { page, limit, skip } = parsePagination(query.page, query.limit);

  const where: any = {
    isActive: true,
  };

  if (query.q) {
    where.OR = [
      { businessName: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { city: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  if (query.type) {
    where.businessType = query.type;
  }

  if (query.state) {
    where.state = { equals: query.state, mode: 'insensitive' };
  }

  if (query.city) {
    where.city = { equals: query.city, mode: 'insensitive' };
  }

  if (query.verified === 'true') {
    where.verificationStatus = 'VERIFIED';
  }

  const [total, suppliers] = await Promise.all([
    prisma.supplierProfile.count({ where }),
    prisma.supplierProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isFeatured: 'desc' }, { verificationStatus: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        businessName: true,
        businessType: true,
        city: true,
        state: true,
        logoUrl: true,
        verificationStatus: true,
        yearEstablished: true,
        rating: true,
        responseRate: true,
        productCount: true,
      },
    }),
  ]);

  return {
    suppliers,
    meta: buildPaginationMeta(total, page, limit),
  };
}
