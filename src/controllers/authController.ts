import { Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { RegisterRequest, LoginRequest, AuthResponse, AuthenticatedRequest } from '../types/index.js';
import { createToken, validateToken } from '../services/tokenService.js';
import { sendEmail, generateVerificationEmail, generatePasswordResetEmail } from '../config/email.js';
import bcrypt from 'bcryptjs';
import { Token } from '../entities/Token.js';
import { MoreThan } from 'typeorm';
import { registerSchema, loginSchema, resetPasswordSchema } from '../utils/authSchemas.js';
import { ApiError } from '../utils/ApiError.js';

const userRepository = AppDataSource.getRepository(User);

export const register = async (req: Request<{}, {}, RegisterRequest>, res: Response<AuthResponse | { error: string }>) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, 'Validation failed', parseResult.error.errors);
    }

    const { email, password, name } = parseResult.data;

    // Check if email exists in database
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(400, 'Email already registered');
    }

    // Create user
    const user = new User();
    user.email = email;
    user.password = await bcrypt.hash(password, 10);
    user.name = name;
    user.isEmailVerified = false;
    
    // Save user first
    await userRepository.save(user);
    console.log('User saved successfully:', { userId: user.id, email: user.email });

    // Create verification token
    const token = await createToken(user.id, 'verification');
    console.log('Verification token created:', { token });

    // Send verification email
    try {
      await sendEmail(
        user.email,
        'Verify your email',
        generateVerificationEmail(token)
      );
      console.log('Verification email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't throw error here, just log it
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error instanceof ApiError) {
      return res.status(error.status).json({ error: error.message, details: error.details });
    }
    res.status(500).json({ error: 'Error during registration' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userId = await validateToken(token, 'verification');
    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.isEmailVerified = true;
    await userRepository.save(user);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Error verifying email' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const tokenRepository = AppDataSource.getRepository(Token);
    const token = await createToken(user.id, 'reset');
    await sendEmail(user.email, 'Reset your password', generatePasswordResetEmail(token));
    res.json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Error processing password reset request' });
  }
};

export const getResetPasswordPage = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    const tokenRepository = AppDataSource.getRepository(Token);
    const tokenRecord = await tokenRepository.findOne({
      where: {
        token: token as string,
        type: 'reset',
        expiresAt: MoreThan(new Date()),
      },
    });
    if (!tokenRecord) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const user = await userRepository.findOne({ where: { id: tokenRecord.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.send(`
      <html>
        <body>
          <h1>Reset Your Password</h1>
          <form id="resetForm">
            <input type="hidden" id="token" value="${token}">
            <div>
              <label for="newPassword">New Password:</label>
              <input type="password" id="newPassword" required>
            </div>
            <button type="submit">Reset Password</button>
          </form>
          <script>
            document.getElementById('resetForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const token = document.getElementById('token').value;
              const newPassword = document.getElementById('newPassword').value;
              try {
                const response = await fetch('/api/reset-password', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ token, newPassword })
                });
                const data = await response.json();
                if (response.ok) {
                  alert('Password reset successful! You can now login with your new password.');
                  window.location.href = '/api/login';
                } else {
                  alert(data.error || 'Error resetting password');
                }
              } catch (error) {
                alert('Error resetting password');
              }
            });
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Reset password page error:', error);
    res.status(500).json({ error: 'Error loading reset password page' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, 'Validation failed', parseResult.error.errors);
    }
    const { token, newPassword } = parseResult.data;
    const tokenRepository = AppDataSource.getRepository(Token);
    const tokenRecord = await tokenRepository.findOne({
      where: {
        token,
        type: 'reset',
        expiresAt: MoreThan(new Date()),
      },
    });
    if (!tokenRecord) {
      throw new ApiError(400, 'Invalid or expired token');
    }
    await tokenRepository.remove(tokenRecord);
    const user = await userRepository.findOne({ where: { id: tokenRecord.userId } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await userRepository.save(user);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, details: error.details });
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, 'Validation failed', parseResult.error.errors);
    }
    const { email, password } = parseResult.data;
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }
    if (!user.isEmailVerified) {
      throw new ApiError(401, 'Please verify your email before logging in');
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid credentials');
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, details: error.details });
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
};

export const getProfile = (async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email']
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler;

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRepository.remove(user);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
}; 