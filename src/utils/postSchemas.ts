import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
}); 