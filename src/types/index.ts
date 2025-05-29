import { Request } from 'express';
import { User } from '../entities/User.js';
import { Post } from '../entities/Post.js';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message?: string;
  error?: string;
  details?: any;
  token?: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export interface CreatePostRequest {
  title: string;
  body: string;
}

export interface UpdatePostRequest {
  title?: string;
  body?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
  };
} 