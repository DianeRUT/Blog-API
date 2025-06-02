import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.js';
import { Post, PostStatus } from '../entities/Post.js';
import { User, UserRole } from '../entities/User.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiError } from '../utils/ApiError.js';
import { createPostSchema, updatePostSchema } from '../utils/postSchemas.js';
import { PostCategory } from '../entities/Post.js';
import { sendEmail } from '../config/email.js';
import { formatPostResponse } from '../dtos/post.dto.js';

const postRepository = AppDataSource.getRepository(Post);
const userRepository = AppDataSource.getRepository(User);

// Get all published posts
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await postRepository.find({
      where: { status: PostStatus.PUBLISHED },
      relations: ['author'],
      order: { createdAt: 'DESC' }
    });

    // Format all posts using DTO
    const formattedPosts = posts.map(formatPostResponse);
    res.json(formattedPosts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get post by ID (published posts for users, all posts for authors and admins)
export const getPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await postRepository.findOne({
      where: { id: parseInt(id) },
      relations: {
        author: true
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Format the response using DTO
    const formattedPost = formatPostResponse(post);
    res.json(formattedPost);
  } catch (error: any) {
    console.error('Error getting post:', error);
    res.status(500).json({ message: 'Error getting post' });
  }
};

// Create a new post (Authors and Admins only)
export const createPost = async (req: Request, res: Response) => {
  try {
    const parseResult = createPostSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ApiError(400, 'Validation failed', parseResult.error.errors);
    }

    const userId = (req as unknown as AuthenticatedRequest).user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (user.role !== UserRole.AUTHOR && user.role !== UserRole.ADMIN) {
      throw new ApiError(403, 'Only authors and admins can create posts');
    }

    const { title, body } = parseResult.data;
    const post = new Post();
    post.title = title;
    post.body = body;
    post.authorId = userId;
    post.status = PostStatus.DRAFT; // Always create as draft

    await postRepository.save(post);
    res.status(201).json(post);
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, details: error.details });
    res.status(500).json({ error: error.message });
  }
};

// Update post status (Admin only)
export const updatePostStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(PostStatus).includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }

    const userId = (req as unknown as AuthenticatedRequest).user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ApiError(403, 'Only admins can update post status');
    }

    const post = await postRepository.findOne({ 
      where: { id: parseInt(id) },
      relations: ['author']
    });
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    post.status = status;
    if (status === PostStatus.PUBLISHED) {
      post.publishedAt = new Date();
    }

    await postRepository.save(post);

    // Send email notification to author
    try {
      const subject = status === PostStatus.PUBLISHED 
        ? 'Your post has been published!' 
        : 'Your post has been rejected';
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">${subject}</h1>
          <p>Hello ${post.author.name},</p>
          <p>Your post "${post.title}" has been ${status === PostStatus.PUBLISHED ? 'published' : 'rejected'}.</p>
          ${status === PostStatus.PUBLISHED 
            ? `<p>You can view your published post here: <a href="http://localhost:3000/api/posts/${post.id}">View Post</a></p>`
            : `<p>Please review the admin's comments and make necessary changes.</p>`
          }
          <p>Thank you for contributing to our blog!</p>
        </div>
      `;

      await sendEmail(post.author.email, subject, html);
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't throw error here, just log it
    }

    res.json(post);
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

// Get all posts (including drafts) for authors and admins
export const getMyPosts = async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    let posts;
    if (user.role === UserRole.ADMIN) {
      // Admins can see all posts
      posts = await postRepository.find({
        relations: ['author'],
        order: { createdAt: 'DESC' }
      });
    } else {
      // Authors can only see their own posts
      posts = await postRepository.find({
        where: { authorId: userId },
        relations: ['author'],
        order: { createdAt: 'DESC' }
      });
    }

    res.json(posts);
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

// Get posts by category
export const getPostsByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    if (!Object.values(PostCategory).includes(category as PostCategory)) {
      throw new ApiError(400, 'Invalid category');
    }

    const posts = await postRepository.find({
      where: { 
        category: category as PostCategory,
        status: PostStatus.PUBLISHED 
      },
      relations: ['author'],
      order: { createdAt: 'DESC' }
    });

    res.json(posts);
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

// Get featured posts
export const getFeaturedPosts = async (req: Request, res: Response) => {
  try {
    const posts = await postRepository.find({
      where: { 
        isFeatured: true,
        status: PostStatus.PUBLISHED 
      },
      relations: ['author'],
      order: { publishedAt: 'DESC' }
    });

    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Increment post views
export const incrementViews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await postRepository.findOne({ where: { id: parseInt(id) } });
    
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    post.views += 1;
    await postRepository.save(post);
    res.json({ views: post.views });
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
};

// Get pending posts (Admin only)
export const getPendingPosts = async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ApiError(403, 'Only admins can view pending posts');
    }

    const posts = await postRepository.find({
      where: { status: PostStatus.DRAFT },
      relations: ['author'],
      order: { createdAt: 'DESC' }
    });

    res.json(posts);
  } catch (error: any) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
}; 