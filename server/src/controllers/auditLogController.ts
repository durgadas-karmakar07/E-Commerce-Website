import { Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { asyncHandler } from '../utils/errors.js';

export const getAuditLogsAdmin = asyncHandler(async (req: any, res: Response) => {
  const { resource, action, page = '1', limit = '25' } = req.query;

  const query: any = {};
  if (resource) query.resource = resource;
  if (action) query.action = action;

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 25;
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('user', 'name email role avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});
