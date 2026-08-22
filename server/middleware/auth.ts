import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // Support both header and query param / fallback
  const userId = req.headers['x-user-id'] as string || req.headers['authorization']?.replace('Bearer ', '') || 'default_user';
  req.userId = userId;
  next();
};
