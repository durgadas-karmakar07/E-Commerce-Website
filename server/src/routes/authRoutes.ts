import { Router } from 'express';
import {
  signup,
  login,
  requestPhoneOtp,
  verifyPhoneOtp,
  googleLogin,
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/phone-otp/request', requestPhoneOtp);
router.post('/phone-otp/verify', verifyPhoneOtp);
router.post('/google', googleLogin);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

router.post('/addresses', authenticate, addAddress);
router.put('/addresses/:id', authenticate, updateAddress);
router.delete('/addresses/:id', authenticate, deleteAddress);

export default router;
