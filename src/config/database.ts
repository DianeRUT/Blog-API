import { DataSource } from 'typeorm';
import { User } from '../entities/User.js';
import { Post } from '../entities/Post.js';
import { Token } from '../entities/Token.js';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'blog_db',
  synchronize: process.env.NODE_ENV !== 'production', // Don't use in production
  dropSchema: false, // Don't drop schema in development
  logging: process.env.NODE_ENV !== 'production',
  entities: [User, Post, Token],
  subscribers: ['src/subscribers/*.ts'],
}); 