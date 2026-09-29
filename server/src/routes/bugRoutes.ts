import { Router } from 'express';
import {
  getIssuesAdmin,
  updateIssueStatus,
  triggerTestError,
} from '../controllers/bugController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

router.get('/', getIssuesAdmin);
router.patch('/:id/status', updateIssueStatus);
router.post('/trigger-test', triggerTestError);

export default router;
