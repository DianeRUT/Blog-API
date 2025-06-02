import { Post } from '../entities/Post.js';
import { User } from '../entities/User.js';

export interface PostResponseDTO {
  id: number;
  title: string;
  body: string;
  description: string | null;
  status: string;
  category: string;
  tags: string[] | null;
  featuredImage: string | null;
  readingTime: number;
  views: number;
  isFeatured: boolean;
  slug: string | null;
  author: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export const formatPostResponse = (post: Post): PostResponseDTO => {
  return {
    id: post.id,
    title: post.title,
    body: post.body,
    description: post.description,
    status: post.status,
    category: post.category,
    tags: post.tags,
    featuredImage: post.featuredImage,
    readingTime: post.readingTime,
    views: post.views,
    isFeatured: post.isFeatured,
    slug: post.slug,
    author: post.author ? {
      id: post.author.id,
      name: post.author.name,
      email: post.author.email
    } : null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt || null
  };
}; 