import { Response } from 'express';
import { Wishlist } from '../models/Wishlist.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AppError, asyncHandler } from '../utils/errors.js';

export const getWishlist = asyncHandler(async (req: any, res: Response) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'title slug images sellingPrice mrp discountPercent stock sku isPublished',
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, items: [] });
  }

  const validItems = wishlist.items.filter((item: any) => item.product);

  res.status(200).json({
    success: true,
    wishlist: validItems,
  });
});

export const addToWishlist = asyncHandler(async (req: any, res: Response) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found.', 404);

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, items: [] });
  }

  const alreadyInWishlist = wishlist.items.some(
    (item: any) => item.product.toString() === productId
  );

  if (!alreadyInWishlist) {
    wishlist.items.push({ product: product._id as any, addedAt: new Date() });
    await wishlist.save();
  }

  res.status(200).json({
    success: true,
    message: 'Added to wishlist.',
  });
});

export const removeFromWishlist = asyncHandler(async (req: any, res: Response) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.items = wishlist.items.filter(
      (item: any) => item.product.toString() !== productId
    );
    await wishlist.save();
  }

  res.status(200).json({
    success: true,
    message: 'Removed from wishlist.',
  });
});

export const moveToCart = asyncHandler(async (req: any, res: Response) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product || !product.isPublished) {
    throw new AppError('Product is unavailable.', 400);
  }

  if (product.stock < 1) {
    throw new AppError('Product is currently out of stock.', 400);
  }

  // 1. Remove from wishlist
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.items = wishlist.items.filter(
      (item: any) => item.product.toString() !== productId
    );
    await wishlist.save();
  }

  // 2. Add to cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const existingIndex = cart.items.findIndex(
    (item: any) => item.product.toString() === productId
  );

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity += 1;
  } else {
    cart.items.push({
      product: product._id as any,
      quantity: 1,
      priceAtAddition: product.sellingPrice,
    });
  }

  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Moved item to cart.',
  });
});
