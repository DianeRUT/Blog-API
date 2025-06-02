import { z } from 'zod';
import { PostCategory } from '../entities/Post.js';

export const createPostSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10).max(500),
  body: z.string().min(50),
  category: z.nativeEnum(PostCategory),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).max(500).optional(),
  body: z.string().min(50).optional(),
  category: z.nativeEnum(PostCategory).optional(),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional(),
  isFeatured: z.boolean().optional(),
}); 