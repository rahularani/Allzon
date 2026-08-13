import slugify from 'slugify';
import { prisma } from '../config/database';

/**
 * Generate a URL-safe slug from a string.
 */
function toSlug(input: string): string {
  return slugify(input, {
    lower: true,
    strict: true,  // removes special chars
    trim: true,
  });
}

/**
 * Generate a unique slug for SupplierProfile.
 * Appends a numeric suffix if the base slug already exists.
 * Example: "abc-garments" → "abc-garments-2" → "abc-garments-3"
 */
export async function generateSupplierSlug(
  businessName: string,
  excludeId?: string,
): Promise<string> {
  const base = toSlug(businessName);
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.supplierProfile.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter++;
  }
}

/**
 * Generate a unique slug for Product.
 */
export async function generateProductSlug(
  productName: string,
  excludeId?: string,
): Promise<string> {
  const base = toSlug(productName);
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter++;
  }
}
