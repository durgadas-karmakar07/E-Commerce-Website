import { Response } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AppError, asyncHandler } from '../utils/errors.js';

export const getCart = asyncHandler(async (req: any, res: Response) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'title slug images sellingPrice mrp discountPercent stock sku isPublished',
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Calculate live totals with current database prices
  let subtotal = 0;
  let totalMrp = 0;
  let hasOutOfStock = false;

  const validatedItems = cart.items
    .filter((item: any) => item.product && item.product.isPublished)
    .map((item: any) => {
      const prod = item.product;
      const isAvailable = prod.stock >= item.quantity;
      if (!isAvailable) hasOutOfStock = true;

      const itemTotal = prod.sellingPrice * item.quantity;
      const itemMrpTotal = prod.mrp * item.quantity;
      subtotal += itemTotal;
      totalMrp += itemMrpTotal;

      return {
        _id: item._id,
        product: prod,
        variantSku: item.variantSku,
        quantity: item.quantity,
        price: prod.sellingPrice,
        mrp: prod.mrp,
        discountPercent: prod.discountPercent,
        itemTotal,
        inStock: prod.stock >= item.quantity,
        availableStock: prod.stock,
      };
    });

  const totalDiscount = totalMrp - subtotal;
  // Free delivery for orders above ₹999, else ₹99
  const deliveryCharge = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const estimatedTax = Math.round(subtotal * 0.05); // 5% GST representation
  const finalTotal = subtotal + deliveryCharge + estimatedTax;

  res.status(200).json({
    success: true,
    cart: {
      items: validatedItems,
      itemCount: validatedItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal,
      totalMrp,
      discount: totalDiscount,
      deliveryCharge,
      tax: estimatedTax,
      total: finalTotal,
      hasOutOfStock,
    },
  });
});

export const addToCart = asyncHandler(async (req: any, res: Response) => {
  const { productId, variantSku, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isPublished) {
    throw new AppError('Product is no longer available.', 404);
  }

  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} units available in stock.`, 400);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item: any) =>
      item.product.toString() === productId &&
      (item.variantSku || '') === (variantSku || '')
  );

  if (existingItemIndex > -1) {
    const newQty = cart.items[existingItemIndex].quantity + quantity;
    if (newQty > product.stock) {
      throw new AppError(`Cannot add more than available stock (${product.stock} units).`, 400);
    }
    cart.items[existingItemIndex].quantity = newQty;
    cart.items[existingItemIndex].priceAtAddition = product.sellingPrice;
  } else {
    cart.items.push({
      product: product._id as any,
      variantSku: variantSku || '',
      quantity,
      priceAtAddition: product.sellingPrice,
    });
  }

  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Added to cart.',
  });
});

export const updateCartItemQuantity = asyncHandler(async (req: any, res: Response) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (typeof quantity !== 'number' || quantity < 1) {
    throw new AppError('Quantity must be at least 1.', 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new AppError('Cart not found.', 404);

  const item = (cart.items as any).find((i: any) => i._id?.toString() === itemId);
  if (!item) throw new AppError('Item not found in cart.', 404);

  const product = await Product.findById(item.product);
  if (!product) throw new AppError('Product not found.', 404);

  if (quantity > product.stock) {
    throw new AppError(`Only ${product.stock} units available in stock.`, 400);
  }

  item.quantity = quantity;
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Cart updated.',
  });
});

export const removeFromCart = asyncHandler(async (req: any, res: Response) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new AppError('Cart not found.', 404);

  const itemIndex = cart.items.findIndex((item: any) => item._id.toString() === itemId);
  if (itemIndex > -1) {
    cart.items.splice(itemIndex, 1);
    await cart.save();
  }

  res.status(200).json({
    success: true,
    message: 'Item removed from cart.',
  });
});

export const clearCart = asyncHandler(async (req: any, res: Response) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
  res.status(200).json({
    success: true,
    message: 'Cart cleared.',
  });
});
