import { Response } from 'express';
import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/errors.js';

export const getNotifications = asyncHandler(async (req: any, res: Response) => {
  const isAdmin = req.user.role === 'admin';

  // For admins: notifications where recipient is their ID OR null (broadcast)
  // For customers: notifications where recipient is their ID
  const filter: any = isAdmin
    ? { $or: [{ recipient: req.user._id }, { recipient: null }] }
    : { recipient: req.user._id };

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
  });
});

export const markNotificationRead = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;

  await Notification.findByIdAndUpdate(id, { $set: { isRead: true } });

  res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
  });
});

export const markAllNotificationsRead = asyncHandler(async (req: any, res: Response) => {
  const isAdmin = req.user.role === 'admin';
  const filter: any = isAdmin
    ? { $or: [{ recipient: req.user._id }, { recipient: null }] }
    : { recipient: req.user._id };

  await Notification.updateMany(filter, { $set: { isRead: true } });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
  });
});
