import { Router } from 'express';
import {
  getProductReviews,
  submitReview,
  getMyReviews,
  getAllReviewsAdmin,
  moderateReviewAdmin,
} from '../controllers/reviewController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Public review retrieval for product details page
router.get('/product/:productId', getProductReviews);

// Customer routes
router.post('/', authenticate, submitReview);
router.get('/my-reviews', authenticate, getMyReviews);

// Admin moderation
router.get('/admin', authenticate, requireRole('admin'), getAllReviewsAdmin);
router.put('/admin/:id', authenticate, requireRole('admin'), moderateReviewAdmin);

export default router;
