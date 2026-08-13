import { prisma } from '../../config/database';
import { parsePagination, buildPaginationMeta } from '../../utils/response';
import type { ProductSearchQuery } from './products.schema';

export interface SearchService {
  searchProducts(query: ProductSearchQuery): Promise<{ products: any[]; meta: any }>;
}

export class PostgresSearchService implements SearchService {
  async searchProducts(query: ProductSearchQuery) {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const where: any = {
      status: 'APPROVED',
      isActive: true,
    };

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { brand: { contains: query.q, mode: 'insensitive' } },
        { material: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.OR = [
        { categoryId: query.category },
        { category: { slug: query.category } },
      ];
    }

    if (query.subcategory) {
      where.OR = [
        { subcategoryId: query.subcategory },
        { subcategory: { slug: query.subcategory } },
      ];
    }

    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    if (query.minPrice || query.maxPrice) {
      where.priceMin = {};
      if (query.minPrice) where.priceMin.gte = parseFloat(query.minPrice);
      if (query.maxPrice) where.priceMin.lte = parseFloat(query.maxPrice);
    }

    if (query.minMOQ || query.maxMOQ) {
      where.moq = {};
      if (query.minMOQ) where.moq.gte = parseInt(query.minMOQ, 10);
      if (query.maxMOQ) where.moq.lte = parseInt(query.maxMOQ, 10);
    }

    if (query.verified === 'true') {
      where.supplier = { verificationStatus: 'VERIFIED' };
    }

    if (query.featured === 'true') {
      where.isFeatured = true;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price_asc') {
      orderBy = { priceMin: 'asc' };
    } else if (query.sort === 'price_desc') {
      orderBy = { priceMin: 'desc' };
    } else if (query.sort === 'moq_asc') {
      orderBy = { moq: 'asc' };
    } else if (query.sort === 'rating') {
      orderBy = { supplier: { rating: 'desc' } };
    } else if (query.sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          subcategory: { select: { id: true, name: true, slug: true } },
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
            },
          },
          images: {
            orderBy: { isPrimary: 'desc' },
            take: 1,
            select: { id: true, url: true, altText: true },
          },
        },
      }),
    ]);

    return {
      products,
      meta: buildPaginationMeta(total, page, limit),
    };
  }
}

export const searchService: SearchService = new PostgresSearchService();
