import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { checkRole } from '../middlewares/checkRole.js';
import { UserRole } from '../entities/User.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.get('/users', auth, checkRole([UserRole.ADMIN]), adminController.getAllUsers);
router.patch('/users/:id/role', auth, checkRole([UserRole.ADMIN]), adminController.updateUserRole);
router.delete('/users/:id', auth, checkRole([UserRole.ADMIN]), adminController.deleteUser);

export default router; 