import { Router } from 'express';
import { createPaymentIntent, verifyPayment } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/create-intent', createPaymentIntent);
router.post('/verify', verifyPayment);

export default router;
