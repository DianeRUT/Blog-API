import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../entities/User.js';
import { AuthenticatedRequest } from '../types/index.js';
import { AppDataSource } from '../config/database.js';
import { User } from '../entities/User.js';

export const checkRole = (roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as unknown as AuthenticatedRequest).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Error checking role' });
    }
  };
}; 