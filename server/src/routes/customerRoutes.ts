import { Router } from 'express';
import {
  getCustomersAdmin,
  getCustomerDetailsAdmin,
  toggleCustomerStatusAdmin,
} from '../controllers/customerController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/', getCustomersAdmin);
router.get('/:id', getCustomerDetailsAdmin);
router.patch('/:id/status', toggleCustomerStatusAdmin);

export default router;
