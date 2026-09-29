import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { IssueReference } from '../models/IssueReference.js';
import { config } from '../config/env.js';

export const errorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred.';
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `${field} already exists. Please use a unique value.`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((el: any) => el.message);
    message = `Validation failed: ${errors.join(', ')}`;
  }

  // Handle Zod Error
  if (err.name === 'ZodError') {
    statusCode = 400;
    const details = err.errors ? err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ') : err.message;
    message = `Validation error: ${details}`;
  }

  // For 500 unexpected errors, log into IssueReference model
  if (statusCode >= 500) {
    severity = statusCode >= 500 ? 'high' : 'critical';
    try {
      const errorId = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await IssueReference.create({
        errorId,
        title: err.name || 'Internal Server Error',
        message: err.message || 'Unknown server exception',
        stack: err.stack || '',
        severity,
        route: req.originalUrl || req.url,
        method: req.method,
        statusCode,
        status: 'open',
        occurrences: 1,
        lastOccurredAt: new Date(),
        environment: config.nodeEnv,
        metadata: {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch (logErr) {
      console.error('[ErrorLogger] Failed to write issue to database:', logErr);
    }
  }

  console.error(`[API Error] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    details: err.details || undefined,
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
};
