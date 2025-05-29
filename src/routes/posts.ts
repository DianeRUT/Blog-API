import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { checkRole } from '../middlewares/checkRole.js';
import { UserRole } from '../entities/User.js';
import * as postController from '../controllers/postController.js';

const router = Router();

// Create a new post (Authors and Admins only)
router.post('/', auth, checkRole([UserRole.AUTHOR, UserRole.ADMIN]), postController.createPost);

// Get all posts with pagination (Public)
router.get('/', postController.getAllPosts);

// Get single post by ID (Public)
router.get('/:id', postController.getPostById);

// Update a post (Author of post or Admin only)
router.put('/:id', auth, postController.updatePost);

// Delete a post (Author of post or Admin only)
router.delete('/:id', auth, postController.deletePost);

export default router; 