import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { AppError } from '../utils/errors.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // Verify JWT
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: string };
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
      }

      if (user.status === 'disabled') {
        return next(new AppError('Your account has been deactivated. Please contact support.', 403));
      }

      req.user = user;
      next();
    } catch (jwtErr: any) {
      return next(new AppError('Invalid or expired authentication token. Please log in again.', 401));
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: string };
        const user = await User.findById(decoded.id);
        if (user && user.status === 'active') {
          req.user = user;
        }
      } catch (e) {
        // Silently continue as guest
      }
    }
    next();
  } catch (error) {
    next();
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(`Access denied. You do not have permission (${req.user.role}) for this resource.`, 403));
    }

    next();
  };
};
