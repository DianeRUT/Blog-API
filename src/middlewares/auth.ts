import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';
import { AuthenticatedRequest } from '../types/index.js';

const userRepository = AppDataSource.getRepository(User);

export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
    ) as { userId: number };

    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!user) {
      throw new Error();
    }

    (req as unknown as AuthenticatedRequest).user = { userId: user.id };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate.' });
  }
}; 