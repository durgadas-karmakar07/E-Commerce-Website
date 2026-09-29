import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().min(3, 'Product title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  brand: z.string().min(1, 'Brand is required'),
  sku: z.string().min(2, 'SKU is required'),
  mrp: z.number().positive('MRP must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  discountPercent: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).default(5),
  images: z.array(z.string()).default([]),
  videoUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  variants: z
    .array(
      z.object({
        name: z.string(),
        sku: z.string(),
        price: z.number().positive(),
        stock: z.number().int().min(0),
        attributes: z.record(z.string()).default({}),
      })
    )
    .default([]),
  specifications: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
        group: z.string().optional(),
      })
    )
    .default([]),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});
