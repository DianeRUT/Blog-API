import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import * as authController from '../controllers/authController.js';
import { Request, Response } from 'express';
import { sendEmail } from '../config/email.js';

const router = Router();

router.post('/register', authController.register);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password', authController.getResetPasswordPage);
router.post('/reset-password', authController.resetPassword);
router.post('/login', authController.login);
router.get('/profile', auth, authController.getProfile);

// Add test email endpoint
router.post('/test-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await sendEmail(
      email,
      'Test Email',
      '<h1>Test Email</h1><p>If you receive this, email configuration is working!</p>'
    );

    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

export default router; 