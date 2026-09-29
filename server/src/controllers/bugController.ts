import { Request, Response } from 'express';
import { IssueReference } from '../models/IssueReference.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { logAudit } from '../utils/auditLogger.js';

export const getIssuesAdmin = asyncHandler(async (req: any, res: Response) => {
  const { status, severity, page = '1', limit = '20' } = req.query;

  const query: any = {};
  if (status) query.status = status;
  if (severity) query.severity = severity;

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [issues, total, openCount, criticalCount, resolvedCount] = await Promise.all([
    IssueReference.find(query).sort({ lastOccurredAt: -1 }).skip(skip).limit(limitNum).lean(),
    IssueReference.countDocuments(query),
    IssueReference.countDocuments({ status: 'open' }),
    IssueReference.countDocuments({ severity: 'critical', status: { $ne: 'resolved' } }),
    IssueReference.countDocuments({ status: 'resolved' }),
  ]);

  res.status(200).json({
    success: true,
    issues,
    stats: {
      openCount,
      criticalCount,
      resolvedCount,
      totalTracked: total,
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

export const updateIssueStatus = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['open', 'investigating', 'resolved'].includes(status)) {
    throw new AppError('Status must be "open", "investigating", or "resolved".', 400);
  }

  const issue = await IssueReference.findById(id);
  if (!issue) throw new AppError('Issue not found.', 404);

  issue.status = status;
  await issue.save();

  await logAudit({
    req,
    action: 'UPDATE_ISSUE_STATUS',
    resource: 'IssueReference',
    resourceId: id,
    changes: { status },
  });

  res.status(200).json({
    success: true,
    message: `Issue marked as ${status}.`,
    issue,
  });
});

export const triggerTestError = asyncHandler(async (req: any, res: Response) => {
  // Deliberately throw an operational server error to test error boundary & monitoring
  throw new Error('Test application exception triggered by admin to verify diagnostic pipeline.');
});
