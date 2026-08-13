import { prisma } from '../../config/database';
import { conflict, notFound } from '../../middleware/error.middleware';
import slugify from 'slugify';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateSubcategoryInput,
  UpdateSubcategoryInput,
} from './categories.schema';

function toSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, trim: true });
}

export async function listCategoriesService() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    include: {
      subcategories: {
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });
  return categories;
}

export async function getCategoryByIdOrSlugService(idOrSlug: string) {
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      isActive: true,
    },
    include: {
      subcategories: { where: { isActive: true } },
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    throw notFound('Category not found');
  }

  return category;
}

export async function createCategoryService(input: CreateCategoryInput) {
  const slug = toSlug(input.name);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ name: input.name }, { slug }] },
  });

  if (existing) {
    throw conflict('Category with this name already exists');
  }

  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      icon: input.icon,
      displayOrder: input.displayOrder ?? 0,
    },
  });

  return category;
}

export async function updateCategoryService(id: string, input: UpdateCategoryInput) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw notFound('Category not found');

  let slug = category.slug;
  if (input.name && input.name !== category.name) {
    slug = toSlug(input.name);
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...input,
      slug,
    },
  });

  return updated;
}

export async function deleteCategoryService(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw notFound('Category not found');

  await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: 'Category deleted' };
}

export async function createSubcategoryService(
  categoryId: string,
  input: CreateSubcategoryInput,
) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw notFound('Parent category not found');

  const slug = toSlug(input.name);
  const existing = await prisma.subcategory.findFirst({
    where: { slug },
  });

  if (existing) throw conflict('Subcategory with this name already exists');

  const subcategory = await prisma.subcategory.create({
    data: {
      categoryId,
      name: input.name,
      slug,
      displayOrder: input.displayOrder ?? 0,
    },
  });

  return subcategory;
}

export async function updateSubcategoryService(
  subcategoryId: string,
  input: UpdateSubcategoryInput,
) {
  const subcategory = await prisma.subcategory.findUnique({ where: { id: subcategoryId } });
  if (!subcategory) throw notFound('Subcategory not found');

  let slug = subcategory.slug;
  if (input.name && input.name !== subcategory.name) {
    slug = toSlug(input.name);
  }

  const updated = await prisma.subcategory.update({
    where: { id: subcategoryId },
    data: {
      ...input,
      slug,
    },
  });

  return updated;
}

export async function deleteSubcategoryService(subcategoryId: string) {
  const subcategory = await prisma.subcategory.findUnique({ where: { id: subcategoryId } });
  if (!subcategory) throw notFound('Subcategory not found');

  await prisma.subcategory.update({
    where: { id: subcategoryId },
    data: { isActive: false },
  });

  return { message: 'Subcategory deleted' };
}
