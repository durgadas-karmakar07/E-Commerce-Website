import mongoose, { Document, Schema } from 'mongoose';

export interface IReturnRequest extends Document {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  item: {
    product: mongoose.Types.ObjectId;
    variantSku?: string;
    quantity: number;
    price: number;
  };
  reason: 'defective' | 'wrong_item' | 'size_issue' | 'not_as_described' | 'other';
  notes: string;
  images: string[];
  status: 'requested' | 'approved' | 'rejected' | 'item_received' | 'refund_initiated' | 'refund_completed';
  adminNotes: string;
  refundAmount: number;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnRequestSchema = new Schema<IReturnRequest>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    item: {
      product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      variantSku: { type: String, default: '' },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true },
    },
    reason: {
      type: String,
      enum: ['defective', 'wrong_item', 'size_issue', 'not_as_described', 'other'],
      required: true,
    },
    notes: { type: String, default: '' },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'item_received', 'refund_initiated', 'refund_completed'],
      default: 'requested',
      index: true,
    },
    adminNotes: { type: String, default: '' },
    refundAmount: { type: Number, default: 0 },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

export const ReturnRequest = mongoose.model<IReturnRequest>('ReturnRequest', ReturnRequestSchema);
