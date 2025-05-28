import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { User, UserRole } from '../entities/User.js';
import { ApiError } from '../utils/ApiError.js';

const userRepository = AppDataSource.getRepository(User);

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userRepository.find({
      select: ['id', 'email', 'name', 'role', 'isEmailVerified', 'createdAt']
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!Object.values(UserRole).includes(role)) {
      throw new ApiError(400, 'Invalid role');
    }
    const user = await userRepository.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    user.role = role;
    await userRepository.save(user);
    res.json({ message: 'User role updated successfully' });
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, details: error.details });
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userRepository.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    await userRepository.remove(user);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, details: error.details });
    res.status(500).json({ error: error.message });
  }
}; 