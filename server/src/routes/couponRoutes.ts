import { Router } from 'express';
import {
  validateCoupon,
  getCouponsAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  deleteCouponAdmin,
} from '../controllers/couponController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Customer coupon validation
router.post('/validate', authenticate, validateCoupon);

// Admin coupon management
router.get('/', authenticate, requireRole('admin'), getCouponsAdmin);
router.post('/', authenticate, requireRole('admin'), createCouponAdmin);
router.put('/:id', authenticate, requireRole('admin'), updateCouponAdmin);
router.delete('/:id', authenticate, requireRole('admin'), deleteCouponAdmin);

export default router;
