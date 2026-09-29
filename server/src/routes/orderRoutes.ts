import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  submitReturnRequest,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  recordRefundAdmin,
  getReturnRequestsAdmin,
  updateReturnRequestAdmin,
} from '../controllers/orderController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Admin return routes (must be before :id)
router.get('/returns/all', requireRole('admin'), getReturnRequestsAdmin);
router.patch('/returns/:id/status', requireRole('admin'), updateReturnRequestAdmin);
router.put('/returns/:id/status', requireRole('admin'), updateReturnRequestAdmin);

// Customer routes
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/return', submitReturnRequest);

// Admin routes
router.get('/', requireRole('admin'), getAllOrdersAdmin);
router.put('/:id/status', requireRole('admin'), updateOrderStatusAdmin);
router.patch('/:id/status', requireRole('admin'), updateOrderStatusAdmin);
router.post('/:id/refund', requireRole('admin'), recordRefundAdmin);

export default router;
