import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Centralized error:', err);
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }
  res.status(500).json({
    error: 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
} 