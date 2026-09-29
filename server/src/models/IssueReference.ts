import mongoose, { Document, Schema } from 'mongoose';

export interface IIssueReference extends Document {
  errorId: string;
  title: string;
  message: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  route: string;
  method?: string;
  statusCode?: number;
  status: 'open' | 'investigating' | 'resolved';
  occurrences: number;
  lastOccurredAt: Date;
  environment: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const IssueReferenceSchema = new Schema<IIssueReference>(
  {
    errorId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    stack: { type: String, default: '' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
    route: { type: String, required: true, index: true },
    method: { type: String, default: 'GET' },
    statusCode: { type: Number, default: 500 },
    status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open', index: true },
    occurrences: { type: Number, default: 1 },
    lastOccurredAt: { type: Date, default: Date.now },
    environment: { type: String, default: 'development' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const IssueReference = mongoose.model<IIssueReference>('IssueReference', IssueReferenceSchema);
