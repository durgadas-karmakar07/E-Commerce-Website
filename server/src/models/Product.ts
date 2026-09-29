import mongoose, { Document, Schema } from 'mongoose';

export interface IVariant {
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface ISpecification {
  key: string;
  value: string;
  group?: string;
}

export interface IProduct extends Document {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: mongoose.Types.ObjectId;
  subcategory?: string;
  brand: string;
  sku: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  videoUrl?: string;
  tags: string[];
  variants: IVariant[];
  specifications: ISpecification[];
  isFeatured: boolean;
  isPublished: boolean;
  averageRating: number;
  reviewCount: number;
  totalSold: number;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>({
  name: { type: String, required: true },
  sku: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  attributes: { type: Map, of: String, default: {} },
});

const SpecificationSchema = new Schema<ISpecification>({
  key: { type: String, required: true },
  value: { type: String, required: true },
  group: { type: String, default: 'General' },
});

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subcategory: { type: String, default: '', index: true },
    brand: { type: String, required: true, trim: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0, index: true },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    stock: { type: Number, required: true, default: 0, min: 0, index: true },
    lowStockThreshold: { type: Number, default: 5 },
    images: [{ type: String }],
    videoUrl: { type: String, default: '' },
    tags: [{ type: String, lowercase: true, trim: true }],
    variants: [VariantSchema],
    specifications: [SpecificationSchema],
    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0, min: 0 },
    totalSold: { type: Number, default: 0, min: 0, index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ title: 'text', brand: 'text', tags: 'text', description: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
