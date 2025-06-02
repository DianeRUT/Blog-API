import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Comment } from '../entities/Comment.js';
import { Post } from '../entities/Post.js';
import { User, UserRole } from '../entities/User.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiError } from '../utils/ApiError.js';
import { z } from 'zod';

const commentRepository = AppDataSource.getRepository(Comment);
const postRepository = AppDataSource.getRepository(Post);
const userRepository = AppDataSource.getRepository(User);

const commentSchema = z.object({
  content: z.string().min(1).max(1000)
});

// Add comment to a post
export const addComment = async (req: Request, res: Response) => {
  try {
    const parseResult = commentSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, 'Validation failed', parseResult.error.errors);
    }

    const userId = (req as unknown as AuthenticatedRequest).user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { postId } = req.params;
    const { content } = parseResult.data;

    const post = await postRepository.findOne({ where: { id: parseInt(postId) } });
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    // Only admins can comment on draft posts
    if (post.status === 'draft' && user.role !== UserRole.ADMIN) {
      throw new ApiError(403, 'Only admins can comment on draft posts');
    }

    const comment = new Comment();
    comment.content = content;
    comment.userId = userId;
    comment.postId = parseInt(postId);

    await commentRepository.save(comment);
    res.status(201).json(comment);
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, details: error.details });
    res.status(500).json({ error: error.message });
  }
};

// Get comments for a post
export const getComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const comments = await commentRepository.find({
      where: { postId: parseInt(postId) },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}; 