import { Router } from 'express';
import {
  getProducts,
  getProductBySlugOrId,
  getFeaturedProducts,
  getBestSellers,
  getOffers,
  getBrandsAndFilters,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductMedia,
} from '../controllers/productController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/upload.js';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/bestsellers', getBestSellers);
router.get('/offers', getOffers);
router.get('/filters', getBrandsAndFilters);
router.get('/:identifier', getProductBySlugOrId);

// Admin routes
router.post('/', authenticate, requireRole('admin'), createProduct);
router.put('/:id', authenticate, requireRole('admin'), updateProduct);
router.delete('/:id', authenticate, requireRole('admin'), deleteProduct);
router.post(
  '/upload',
  authenticate,
  requireRole('admin'),
  uploadMedia.array('media', 10),
  uploadProductMedia
);

export default router;
