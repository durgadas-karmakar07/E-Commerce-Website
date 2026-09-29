import { z } from 'zod';

export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['returned', 'delivered'], // approved -> returned, rejected -> delivered
  returned: ['refund_pending'],
  refund_pending: ['refunded'],
  cancelled: [],
  refunded: [],
};

export const checkoutSchema = z.object({
  shippingAddress: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4),
    country: z.string().default('India'),
  }),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['razorpay', 'cod', 'demo']),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'return_requested',
    'returned',
    'refund_pending',
    'refunded',
  ]),
  trackingId: z.string().optional(),
  deliveryPartner: z.string().optional(),
  note: z.string().optional(),
  adminNotes: z.string().optional(),
});
