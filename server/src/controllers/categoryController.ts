import { Request, Response } from 'express';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { logAudit } from '../utils/auditLogger.js';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const { all } = req.query;
  const filter: any = all === 'true' ? {} : { isActive: true };

  const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean();

  // Attach product counts
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.countDocuments({ category: cat._id, isPublished: true });
      return {
        ...cat,
        productCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    categories: categoriesWithCount,
  });
});

export const createCategory = asyncHandler(async (req: any, res: Response) => {
  const { name, description, image, parentCategory, order, isActive } = req.body;

  if (!name || typeof name !== 'string') {
    throw new AppError('Category name is required.', 400);
  }

  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existing = await Category.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const category = await Category.create({
    name,
    slug,
    description: description || '',
    image: image || '',
    parentCategory: parentCategory || null,
    order: order || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  await logAudit({
    req,
    action: 'CREATE_CATEGORY',
    resource: 'Category',
    resourceId: category._id.toString(),
    changes: { name: category.name, slug: category.slug },
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully.',
    category,
  });
});

export const updateCategory = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const category = await Category.findById(id);
  if (!category) throw new AppError('Category not found.', 404);

  const { name, description, image, parentCategory, order, isActive } = req.body;

  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (image !== undefined) category.image = image;
  if (parentCategory !== undefined) category.parentCategory = parentCategory;
  if (order !== undefined) category.order = order;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();

  await logAudit({
    req,
    action: 'UPDATE_CATEGORY',
    resource: 'Category',
    resourceId: category._id.toString(),
    changes: req.body,
  });

  res.status(200).json({
    success: true,
    message: 'Category updated successfully.',
    category,
  });
});

export const deleteCategory = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const category = await Category.findById(id);
  if (!category) throw new AppError('Category not found.', 404);

  const attachedProducts = await Product.countDocuments({ category: id });
  if (attachedProducts > 0) {
    throw new AppError(`Cannot delete category because it has ${attachedProducts} active products.`, 400);
  }

  await Category.findByIdAndDelete(id);

  await logAudit({
    req,
    action: 'DELETE_CATEGORY',
    resource: 'Category',
    resourceId: id,
  });

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully.',
  });
});
