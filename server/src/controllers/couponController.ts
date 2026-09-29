import { Request, Response } from 'express';
import { Coupon } from '../models/Coupon.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { logAudit } from '../utils/auditLogger.js';

export const validateCoupon = asyncHandler(async (req: any, res: Response) => {
  const { code, orderAmount = 0 } = req.body;

  if (!code || !code.trim()) {
    throw new AppError('Coupon code is required.', 400);
  }

  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    throw new AppError('Invalid or expired coupon code.', 404);
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw new AppError('This coupon is no longer active.', 400);
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit reached.', 400);
  }

  if (orderAmount < coupon.minOrderAmount) {
    throw new AppError(
      `Coupon requires a minimum order amount of ₹${coupon.minOrderAmount.toLocaleString('en-IN')}.`,
      400
    );
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((orderAmount * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else {
    discount = Math.min(coupon.discountValue, orderAmount);
  }

  res.status(200).json({
    success: true,
    message: `Coupon "${coupon.code}" applied! You save ₹${discount.toLocaleString('en-IN')}.`,
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
    },
  });
});

// Admin Controllers
export const getCouponsAdmin = asyncHandler(async (req: any, res: Response) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  res.status(200).json({
    success: true,
    coupons,
  });
});

export const createCouponAdmin = asyncHandler(async (req: any, res: Response) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    validFrom,
    validUntil,
    usageLimit,
    perCustomerLimit,
    isActive,
  } = req.body;

  if (!code || !discountType || discountValue === undefined) {
    throw new AppError('Code, discount type, and value are required.', 400);
  }

  const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (existing) {
    throw new AppError('A coupon with this code already exists.', 409);
  }

  const coupon = await Coupon.create({
    code: code.trim().toUpperCase(),
    description: description || '',
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxDiscountAmount: maxDiscountAmount || undefined,
    validFrom: validFrom ? new Date(validFrom) : new Date(),
    validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usageLimit: usageLimit || 1000,
    perCustomerLimit: perCustomerLimit || 1,
    isActive: isActive !== undefined ? isActive : true,
  });

  await logAudit({
    req,
    action: 'CREATE_COUPON',
    resource: 'Coupon',
    resourceId: coupon._id.toString(),
    changes: { code: coupon.code, discountValue },
  });

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully.',
    coupon,
  });
});

export const updateCouponAdmin = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new AppError('Coupon not found.', 404);

  Object.assign(coupon, req.body);
  if (req.body.code) coupon.code = req.body.code.trim().toUpperCase();

  await coupon.save();

  await logAudit({
    req,
    action: 'UPDATE_COUPON',
    resource: 'Coupon',
    resourceId: id,
    changes: req.body,
  });

  res.status(200).json({
    success: true,
    message: 'Coupon updated successfully.',
    coupon,
  });
});

export const deleteCouponAdmin = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  await Coupon.findByIdAndDelete(id);

  await logAudit({
    req,
    action: 'DELETE_COUPON',
    resource: 'Coupon',
    resourceId: id,
  });

  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully.',
  });
});
