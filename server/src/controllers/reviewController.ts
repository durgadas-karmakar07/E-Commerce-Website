import { Request, Response } from 'express';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { logAudit } from '../utils/auditLogger.js';

export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const reviews = await Review.find({ product: productId, status: 'published' })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();

  // Calculate rating breakdown (1 to 5 stars)
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  reviews.forEach((r) => {
    breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    totalRating += r.rating;
  });

  const average = reviews.length > 0 ? Number((totalRating / reviews.length).toFixed(1)) : 0;

  res.status(200).json({
    success: true,
    reviews,
    totalReviews: reviews.length,
    averageRating: average,
    ratingBreakdown: breakdown,
  });
});

export const submitReview = asyncHandler(async (req: any, res: Response) => {
  const { productId, rating, title, comment, media = [] } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5 stars.', 400);
  }
  if (!title || !comment) {
    throw new AppError('Review title and comment are required.', 400);
  }

  // 1. Verify eligibility: customer must have bought and received this product
  const purchasedOrder = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    orderStatus: 'delivered',
  });

  const isVerifiedPurchase = Boolean(purchasedOrder);

  // 2. Prevent duplicate reviews per user per product
  const existingReview = await Review.findOne({
    product: productId,
    user: req.user._id,
  });

  if (existingReview) {
    existingReview.rating = rating;
    existingReview.title = title;
    existingReview.comment = comment;
    existingReview.media = media;
    existingReview.isVerifiedPurchase = isVerifiedPurchase;
    await existingReview.save();

    await updateProductRating(productId);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully.',
      review: existingReview,
    });
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    title,
    comment,
    media,
    isVerifiedPurchase,
    status: 'published',
  });

  // 3. Recalculate average rating & review count for the product
  await updateProductRating(productId);

  res.status(201).json({
    success: true,
    message: 'Thank you! Your review has been posted.',
    review,
  });
});

export const getMyReviews = asyncHandler(async (req: any, res: Response) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'title slug images')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    reviews,
  });
});

// Admin Controllers
export const getAllReviewsAdmin = asyncHandler(async (req: any, res: Response) => {
  const { status, rating, page = '1', limit = '20' } = req.query;

  const query: any = {};
  if (status) query.status = status;
  if (rating) query.rating = parseInt(rating as string, 10);

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('product', 'title slug images')
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

export const moderateReviewAdmin = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { status, adminResponse } = req.body;

  const review = await Review.findById(id);
  if (!review) throw new AppError('Review not found.', 404);

  if (status) review.status = status;
  if (adminResponse !== undefined) review.adminResponse = adminResponse;

  await review.save();
  await updateProductRating(review.product.toString());

  await logAudit({
    req,
    action: 'MODERATE_REVIEW',
    resource: 'Review',
    resourceId: id,
    changes: { status, adminResponse },
  });

  res.status(200).json({
    success: true,
    message: 'Review moderated successfully.',
    review,
  });
});

// Internal helper to update product average rating
const updateProductRating = async (productId: string) => {
  const reviews = await Review.find({ product: productId, status: 'published' });
  const reviewCount = reviews.length;
  const totalScore = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviewCount > 0 ? Number((totalScore / reviewCount).toFixed(1)) : 0;

  await Product.findByIdAndUpdate(productId, {
    averageRating,
    reviewCount,
  });
};
