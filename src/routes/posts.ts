import { Router, Request, Response, RequestHandler } from 'express';
import { AppDataSource } from '../config/database.js';
import { Post } from '../entities/Post.js';
import { User } from '../entities/User.js';
import { auth } from '../middleware/auth.js';
import { CreatePostRequest, UpdatePostRequest, PaginatedResponse, AuthenticatedRequest } from '../types/index.js';

const router = Router();
const postRepository = AppDataSource.getRepository(Post);
const userRepository = AppDataSource.getRepository(User);

// Create a new post
router.post('/posts', auth, (async (req: Request, res: Response) => {
  try {
    const { title, body } = (req as unknown as AuthenticatedRequest<{}, {}, CreatePostRequest>).body;
    const post = new Post();
    post.title = title;
    post.body = body;
    post.authorId = (req as unknown as AuthenticatedRequest).user.id;
    
    await postRepository.save(post);
    res.status(201).json(post);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}) as RequestHandler);

// Get all posts with pagination
router.get('/posts', async (req: Request, res: Response<PaginatedResponse<Post> | { error: string }>) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await postRepository.findAndCount({
      relations: ['author'],
      select: {
        author: {
          id: true,
          username: true
        }
      },
      order: {
        createdAt: 'DESC'
      },
      skip,
      take: limit
    });

    res.json({
      data: posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single post by ID
router.get('/posts/:id', (async (req: Request<{ id: string }>, res: Response) => {
  try {
    const post = await postRepository.findOne({
      where: { id: req.params.id },
      relations: ['author'],
      select: {
        author: {
          id: true,
          username: true
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as unknown as RequestHandler);

// Update a post
router.put('/posts/:id', auth, (async (req: Request, res: Response) => {
  try {
    const post = await postRepository.findOne({
      where: { id: req.params.id }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== (req as unknown as AuthenticatedRequest).user.id) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const { title, body } = (req as unknown as AuthenticatedRequest<{}, {}, UpdatePostRequest>).body;
    if (title) post.title = title;
    if (body) post.body = body;
    
    await postRepository.save(post);
    res.json(post);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}) as unknown as RequestHandler);

// Delete a post
router.delete('/posts/:id', auth, (async (req: Request, res: Response) => {
  try {
    const post = await postRepository.findOne({
      where: { id: req.params.id }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== (req as unknown as AuthenticatedRequest).user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await postRepository.remove(post);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}) as unknown as RequestHandler);

export default router; 