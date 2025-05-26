// src/utils/middleware/auth.middleware.ts
// Authentication middleware for protecting routes

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      uid: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      uid: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    // If token verification fails, continue without setting user
    if (error instanceof jwt.TokenExpiredError) {
      console.log('Token expired, continuing as unauthenticated request');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('Invalid token, continuing as unauthenticated request');
    } else {
      console.error('Unexpected authentication error:', error);
    }
    next();
  }
};