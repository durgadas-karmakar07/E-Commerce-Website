import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryTransaction extends Document {
  product: mongoose.Types.ObjectId;
  sku: string;
  type: 'restock' | 'sale' | 'adjustment' | 'return_restored' | 'cancellation_restored' | 'damage';
  previousStock: number;
  quantityChanged: number;
  newStock: number;
  reason: string;
  user?: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['restock', 'sale', 'adjustment', 'return_restored', 'cancellation_restored', 'damage'],
      required: true,
      index: true,
    },
    previousStock: { type: Number, required: true },
    quantityChanged: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const InventoryTransaction = mongoose.model<IInventoryTransaction>(
  'InventoryTransaction',
  InventoryTransactionSchema
);
