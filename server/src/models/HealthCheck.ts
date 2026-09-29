import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthCheck extends Document {
  component: string;
  status: 'healthy' | 'degraded' | 'down' | 'unconfigured';
  message: string;
  details?: Record<string, any>;
  responseTimeMs: number;
  checkedAt: Date;
}

const HealthCheckSchema = new Schema<IHealthCheck>(
  {
    component: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'down', 'unconfigured'],
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    responseTimeMs: { type: Number, default: 0 },
    checkedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'checkedAt', updatedAt: false } }
);

export const HealthCheck = mongoose.model<IHealthCheck>('HealthCheck', HealthCheckSchema);
