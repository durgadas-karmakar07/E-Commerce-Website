import { Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { productSchema } from '../validators/productValidators.js';
import { logAudit } from '../utils/auditLogger.js';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const {
    q,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    discount,
    inStock,
    isFeatured,
    sort = 'newest',
    page = '1',
    limit = '12',
    adminView,
  } = req.query;

  const query: any = {};

  // For regular public store, only show published products
  if (adminView !== 'true') {
    query.isPublished = true;
  }

  // Text search
  if (q && typeof q === 'string' && q.trim()) {
    const searchRegex = new RegExp(q.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { brand: searchRegex },
      { sku: searchRegex },
      { tags: searchRegex },
      { description: searchRegex },
    ];
  }

  // Category filter
  if (category && typeof category === 'string') {
    const foundCategory = await Category.findOne({
      $or: [{ _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }, { slug: category }],
    });
    if (foundCategory) {
      query.category = foundCategory._id;
    }
  }

  // Brand filter
  if (brand && typeof brand === 'string') {
    query.brand = new RegExp(`^${brand.trim()}$`, 'i');
  }

  // Price range
  if (minPrice || maxPrice) {
    query.sellingPrice = {};
    if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice as string);
    if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice as string);
  }

  // Rating filter
  if (minRating) {
    query.averageRating = { $gte: parseFloat(minRating as string) };
  }

  // Discount percentage filter
  if (discount) {
    query.discountPercent = { $gte: parseFloat(discount as string) };
  }

  // Availability filter
  if (inStock === 'true') {
    query.stock = { $gt: 0 };
  } else if (inStock === 'false') {
    query.stock = { $lte: 0 };
  }

  if (isFeatured === 'true') {
    query.isFeatured = true;
  }

  // Sort options
  let sortOption: any = { createdAt: -1 };
  if (sort === 'newest') sortOption = { createdAt: -1 };
  else if (sort === 'price-asc') sortOption = { sellingPrice: 1 };
  else if (sort === 'price-desc') sortOption = { sellingPrice: -1 };
  else if (sort === 'rating') sortOption = { averageRating: -1, reviewCount: -1 };
  else if (sort === 'bestselling') sortOption = { totalSold: -1 };
  else if (sort === 'discount') sortOption = { discountPercent: -1 };

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

export const getProductBySlugOrId = asyncHandler(async (req: Request, res: Response) => {
  const { identifier } = req.params;

  const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: identifier } : { slug: identifier };

  const product = await Product.findOne(query).populate('category', 'name slug').lean();
  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  // Fetch related products in same category
  const relatedProducts = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isPublished: true,
  })
    .limit(4)
    .lean();

  res.status(200).json({
    success: true,
    product,
    relatedProducts,
  });
});

export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({ isFeatured: true, isPublished: true })
    .populate('category', 'name slug')
    .limit(8)
    .lean();

  res.status(200).json({ success: true, products });
});

export const getBestSellers = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({ isPublished: true })
    .populate('category', 'name slug')
    .sort({ totalSold: -1, averageRating: -1 })
    .limit(8)
    .lean();

  res.status(200).json({ success: true, products });
});

export const getOffers = asyncHandler(async (req: Request, res: Response) => {
  const products = await Product.find({ isPublished: true, discountPercent: { $gte: 15 } })
    .populate('category', 'name slug')
    .sort({ discountPercent: -1 })
    .limit(8)
    .lean();

  res.status(200).json({ success: true, products });
});

export const getBrandsAndFilters = asyncHandler(async (req: Request, res: Response) => {
  const brands = await Product.distinct('brand', { isPublished: true });
  const priceStats = await Product.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: null, min: { $min: '$sellingPrice' }, max: { $max: '$sellingPrice' } } },
  ]);

  res.status(200).json({
    success: true,
    brands: brands.filter(Boolean).sort(),
    priceRange: {
      min: priceStats[0]?.min || 0,
      max: priceStats[0]?.max || 100000,
    },
  });
});

// Admin Controllers
export const createProduct = asyncHandler(async (req: any, res: Response) => {
  const parsed = productSchema.parse(req.body);

  // Auto-calculate discount percentage if not explicitly provided
  const discountPercent =
    parsed.discountPercent ??
    (parsed.mrp > parsed.sellingPrice
      ? Math.round(((parsed.mrp - parsed.sellingPrice) / parsed.mrp) * 100)
      : 0);

  // Generate URL slug from title
  let slug = parsed.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existingSlug = await Product.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const product = await Product.create({
    ...parsed,
    slug,
    discountPercent,
  });

  // Create initial inventory transaction
  if (parsed.stock > 0) {
    await InventoryTransaction.create({
      product: product._id,
      sku: product.sku,
      type: 'restock',
      previousStock: 0,
      quantityChanged: parsed.stock,
      newStock: parsed.stock,
      reason: 'Initial product creation stock',
      user: req.user?._id,
    });
  }

  await logAudit({
    req,
    action: 'CREATE_PRODUCT',
    resource: 'Product',
    resourceId: product._id.toString(),
    changes: { title: product.title, sku: product.sku, stock: product.stock },
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully.',
    product,
  });
});

export const updateProduct = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const parsed = productSchema.partial().parse(req.body);

  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found.', 404);

  const prevStock = product.stock;

  // Recalculate discount if prices change
  const mrp = parsed.mrp ?? product.mrp;
  const sellingPrice = parsed.sellingPrice ?? product.sellingPrice;
  const discountPercent =
    parsed.discountPercent ??
    (mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0);

  Object.assign(product, parsed, { discountPercent });
  await product.save();

  // If stock changed directly via product edit, log inventory transaction
  if (parsed.stock !== undefined && parsed.stock !== prevStock) {
    const diff = parsed.stock - prevStock;
    await InventoryTransaction.create({
      product: product._id,
      sku: product.sku,
      type: 'adjustment',
      previousStock: prevStock,
      quantityChanged: diff,
      newStock: parsed.stock,
      reason: 'Manual adjustment via product edit',
      user: req.user?._id,
    });
  }

  await logAudit({
    req,
    action: 'UPDATE_PRODUCT',
    resource: 'Product',
    resourceId: product._id.toString(),
    changes: parsed,
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully.',
    product,
  });
});

export const deleteProduct = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) throw new AppError('Product not found.', 404);

  // Soft-delete or unpublish
  product.isPublished = false;
  await product.save();

  await logAudit({
    req,
    action: 'UNPUBLISH_PRODUCT',
    resource: 'Product',
    resourceId: product._id.toString(),
  });

  res.status(200).json({
    success: true,
    message: 'Product unpublished successfully.',
  });
});

export const uploadProductMedia = asyncHandler(async (req: any, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError('No files uploaded.', 400);
  }

  // Construct accessible media URLs
  const mediaUrls = req.files.map((file: Express.Multer.File) => {
    return `/uploads/${file.filename}`;
  });

  res.status(200).json({
    success: true,
    message: `${mediaUrls.length} file(s) uploaded successfully.`,
    urls: mediaUrls,
  });
});
