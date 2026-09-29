import { Router } from 'express';
import { getWebsiteHealth } from '../controllers/healthController.js';

const router = Router();

// Public / operational health check
router.get('/', getWebsiteHealth);

export default router;
