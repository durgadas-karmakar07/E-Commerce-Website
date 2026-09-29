import { Router } from 'express';
import { getReportData } from '../controllers/reportsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/', getReportData);
router.get('/export', getReportData);

export default router;
