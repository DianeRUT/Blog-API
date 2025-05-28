import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Post } from '../entities/Post.js';
import { User } from '../entities/User.js';
import { UserRole } from '../entities/User.js';
import { CreatePostRequest, UpdatePostRequest, PaginatedResponse, AuthenticatedRequest } from '../types/index.js';
import { createPostSchema, updatePostSchema } from '../utils/postSchemas.js';
import { ApiError } from '../utils/ApiError.js';

const postRepository = AppDataSource.getRepository(Post);
const userRepository = AppDataSource.getRepository(User);

export const createPost = async (req: Request, res: Response) => {
  try {
    const parseResult = createPostSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, 'Validation failed', parseResult.error.errors);
    }
    const { title, body } = parseResult.data;
    const userId = (req as unknown as AuthenticatedRequest).user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const post = new Post();
    post.title = title;
    post.body = body;
    post.authorId = userId.toString();
    await postRepository.save(post);
    res.status(201).json(post);
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, details: error.details });
    res.status(400).json({ error: error.message });
  }
};

export const getAllPosts = async (req: Request, res: Response<PaginatedResponse<Post> | { error: string }>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const [posts, total] = await postRepository.findAndCount({
      relations: ['author'],
      select: { author: { id: true, name: true } },
      order: { createdAt: 'DESC' },
      skip,
      take: limit
    });
    res.json({ data: posts, currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPostById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const post = await postRepository.findOne({
      where: { id: req.params.id },
      relations: ['author'],
      select: { author: { id: true, name: true } }
    });
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }
    res.json(post);
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const post = await postRepository.findOne({ where: { id: req.params.id } });
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }
    const userId = (req as unknown as AuthenticatedRequest).user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(401, 'User not found');
    }
    if (user.role !== UserRole.ADMIN && post.authorId !== userId.toString()) {
      throw new ApiError(403, 'Not authorized to update this post');
    }
    const parseResult = updatePostSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, 'Validation failed', parseResult.error.errors);
    }
    const { title, body } = parseResult.data;
    if (title) post.title = title;
    if (body) post.body = body;
    await postRepository.save(post);
    res.json(post);
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, details: error.details });
    res.status(400).json({ error: error.message });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = await postRepository.findOne({ where: { id: req.params.id } });
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }
    const userId = (req as unknown as AuthenticatedRequest).user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(401, 'User not found');
    }
    if (user.role !== UserRole.ADMIN && post.authorId !== userId.toString()) {
      throw new ApiError(403, 'Not authorized to delete this post');
    }
    await postRepository.remove(post);
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
}; 