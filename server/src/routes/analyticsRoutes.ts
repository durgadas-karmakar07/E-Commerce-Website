import { Router } from 'express';
import {
  getDashboardKpis,
  getRevenueAnalytics,
  getBestSellingAnalytics,
  getCustomerAnalytics,
} from '../controllers/analyticsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/kpis', getDashboardKpis);
router.get('/revenue', getRevenueAnalytics);
router.get('/bestsellers', getBestSellingAnalytics);
router.get('/customers', getCustomerAnalytics);

export default router;
