import { Router } from 'express';
import { getAuditLogsAdmin } from '../controllers/auditLogController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/', getAuditLogsAdmin);

export default router;
