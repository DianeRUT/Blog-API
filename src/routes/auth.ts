import { Router, Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { auth } from '../middleware/auth.js';
import { RegisterRequest, LoginRequest, AuthResponse, AuthenticatedRequest } from '../types/index.js';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Register new user
router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response<AuthResponse | { error: string }>) => {
  try {
    const { username, email, password } = req.body;
    
    const user = new User();
    user.username = username;
    user.email = email;
    user.password = password;
    await user.hashPassword();
    
    await userRepository.save(user);

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error: any) {
    if (error.code === '23505') { // PostgreSQL unique violation
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Login user
router.post('/login', (async (req: Request<{}, {}, LoginRequest>, res: Response<AuthResponse | { error: string }>) => {
  try {
    const { email, password } = req.body;
    const user = await userRepository.findOne({ where: { email } });

    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}) as RequestHandler);

// Get user profile
router.get('/profile', auth, (async (req: Request, res: Response) => {
  try {
    const user = await userRepository.findOne({
      where: { id: (req as unknown as AuthenticatedRequest).user.id },
      select: ['id', 'username', 'email']
    });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as RequestHandler);

export default router; 