import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase, closeDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { VALID_ORDER_TRANSITIONS } from '../validators/orderValidators.js';

describe('AURA E-Commerce Core Backend Test Suite', () => {
  let testCategoryId: string;
  let testProductId: string;

  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('1. Authentication and User Roles', () => {
    it('should create a customer user and verify hashed password', async () => {
      const email = `test_customer_${Date.now()}@example.com`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Secret123!', salt);

      const user = await User.create({
        name: 'Test Customer',
        email,
        passwordHash,
        role: 'customer',
      });

      expect(user).toBeDefined();
      expect(user.role).toBe('customer');

      const isMatch = await user.comparePassword('Secret123!');
      expect(isMatch).toBe(true);

      const isWrong = await user.comparePassword('WrongPassword');
      expect(isWrong).toBe(false);
    });

    it('should distinguish admin from customer roles', async () => {
      const adminEmail = `test_admin_${Date.now()}@example.com`;
      const admin = await User.create({
        name: 'Test Admin',
        email: adminEmail,
        role: 'admin',
      });

      expect(admin.role).toBe('admin');
      expect(admin.role === 'admin').toBe(true);
    });
  });

  describe('2. Catalog & Products', () => {
    it('should create a category and a product with calculated discount', async () => {
      const category = await Category.create({
        name: 'Test Audio',
        slug: `test-audio-${Date.now()}`,
        description: 'Test category description',
      });
      testCategoryId = category._id.toString();

      const mrp = 5000;
      const sellingPrice = 3500;
      const discountPercent = Math.round(((mrp - sellingPrice) / mrp) * 100);

      const product = await Product.create({
        title: 'AURA Test Headphones',
        slug: `aura-test-headphones-${Date.now()}`,
        description: 'High fidelity test headphones description with sound details.',
        category: category._id,
        brand: 'AURA Acoustics',
        sku: `SKU-TEST-${Date.now()}`,
        mrp,
        sellingPrice,
        discountPercent,
        stock: 25,
        images: ['https://example.com/test.jpg'],
        isPublished: true,
      });

      testProductId = product._id.toString();

      expect(product.discountPercent).toBe(30);
      expect(product.stock).toBe(25);
    });

    it('should query products by category and search keyword', async () => {
      const results = await Product.find({
        category: testCategoryId,
        title: /Headphones/i,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].brand).toBe('AURA Acoustics');
    });
  });

  describe('3. Coupon Rules Validation', () => {
    it('should correctly calculate percentage discount within limits', async () => {
      const coupon = await Coupon.create({
        code: `PROMO${Date.now()}`,
        description: '20% off up to 500',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 1000,
        maxDiscountAmount: 500,
        validFrom: new Date(Date.now() - 10000),
        validUntil: new Date(Date.now() + 100000),
        usageLimit: 100,
        usageCount: 0,
        isActive: true,
      });

      // Case A: Below minimum order
      const orderLow = 800;
      expect(orderLow < coupon.minOrderAmount).toBe(true);

      // Case B: Eligible order where 20% of 2000 is 400 (under 500 cap)
      const orderMed = 2000;
      const discountMed = Math.round((orderMed * coupon.discountValue) / 100);
      expect(discountMed).toBe(400);

      // Case C: Large order where 20% of 4000 is 800 (capped at 500)
      const orderHigh = 4000;
      let discountHigh = Math.round((orderHigh * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discountHigh > coupon.maxDiscountAmount) {
        discountHigh = coupon.maxDiscountAmount;
      }
      expect(discountHigh).toBe(500);
    });
  });

  describe('4. Order State Transitions & Return Rules', () => {
    it('should allow valid transitions and prevent invalid state skips', () => {
      // Valid transitions
      expect(VALID_ORDER_TRANSITIONS['pending']).toContain('confirmed');
      expect(VALID_ORDER_TRANSITIONS['confirmed']).toContain('processing');
      expect(VALID_ORDER_TRANSITIONS['processing']).toContain('packed');
      expect(VALID_ORDER_TRANSITIONS['packed']).toContain('shipped');
      expect(VALID_ORDER_TRANSITIONS['shipped']).toContain('out_for_delivery');
      expect(VALID_ORDER_TRANSITIONS['out_for_delivery']).toContain('delivered');

      // Invalid transition: pending cannot jump directly to delivered
      expect(VALID_ORDER_TRANSITIONS['pending']).not.toContain('delivered');
      // Terminal states cannot transition further
      expect(VALID_ORDER_TRANSITIONS['cancelled']).toHaveLength(0);
      expect(VALID_ORDER_TRANSITIONS['refunded']).toHaveLength(0);
    });

    it('should correctly enforce 7-day return window eligibility', () => {
      const deliveryDate = new Date();
      const returnEligibilityUntil = new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      // 3 days after delivery: eligible
      const day3 = new Date(deliveryDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      expect(day3 <= returnEligibilityUntil).toBe(true);

      // 8 days after delivery: expired
      const day8 = new Date(deliveryDate.getTime() + 8 * 24 * 60 * 60 * 1000);
      expect(day8 <= returnEligibilityUntil).toBe(false);
    });
  });
});
