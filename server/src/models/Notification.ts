import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient?: mongoose.Types.ObjectId | null; // null represents broadcast to all admins
  title: string;
  message: string;
  type: 'order' | 'inventory' | 'return' | 'payment' | 'system' | 'offer';
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['order', 'inventory', 'return', 'payment', 'system', 'offer'],
      default: 'system',
      index: true,
    },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
