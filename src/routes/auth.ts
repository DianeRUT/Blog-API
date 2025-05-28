import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/register', authController.register);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password', authController.getResetPasswordPage);
router.post('/reset-password', authController.resetPassword);
router.post('/login', authController.login);
router.get('/profile', auth, authController.getProfile);

export default router; 