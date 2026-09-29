import { Request } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { IUser } from '../models/User.js';

interface AuditLogParams {
  req?: Request;
  user?: IUser;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
}

export const logAudit = async ({
  req,
  user,
  action,
  resource,
  resourceId,
  changes = {},
}: AuditLogParams): Promise<void> => {
  try {
    const actingUser = user || (req as any)?.user;
    await AuditLog.create({
      user: actingUser?._id,
      userName: actingUser?.name || 'System',
      userRole: actingUser?.role || 'system',
      action,
      resource,
      resourceId: resourceId || '',
      ipAddress: req?.ip || req?.headers['x-forwarded-for'] || '',
      userAgent: req?.headers['user-agent'] || '',
      changes,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err);
  }
};
