import { Request, Response, NextFunction } from 'express';
import {
  listCategoriesService,
  getCategoryByIdOrSlugService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  createSubcategoryService,
  updateSubcategoryService,
  deleteSubcategoryService,
} from './categories.service';
import { sendSuccess } from '../../utils/response';

export async function listCategoriesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await listCategoriesService();
    sendSuccess(res, categories, 'Categories listed');
  } catch (err) {
    next(err);
  }
}

export async function getCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const idOrSlug = req.params.idOrSlug as string;
    const category = await getCategoryByIdOrSlugService(idOrSlug);
    sendSuccess(res, category, 'Category fetched');
  } catch (err) {
    next(err);
  }
}

export async function createCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await createCategoryService(req.body);
    sendSuccess(res, category, 'Category created', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const category = await updateCategoryService(id, req.body);
    sendSuccess(res, category, 'Category updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const result = await deleteCategoryService(id);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}

export async function createSubcategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const subcategory = await createSubcategoryService(id, req.body);
    sendSuccess(res, subcategory, 'Subcategory created', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateSubcategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subId = req.params.subId as string;
    const subcategory = await updateSubcategoryService(subId, req.body);
    sendSuccess(res, subcategory, 'Subcategory updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteSubcategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const subId = req.params.subId as string;
    const result = await deleteSubcategoryService(subId);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
}
