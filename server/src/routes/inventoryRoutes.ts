import { Router } from 'express';
import {
  getInventoryOverview,
  adjustStock,
  getInventoryTransactions,
} from '../controllers/inventoryController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/overview', getInventoryOverview);
router.post('/adjust', adjustStock);
router.get('/transactions', getInventoryTransactions);

export default router;
