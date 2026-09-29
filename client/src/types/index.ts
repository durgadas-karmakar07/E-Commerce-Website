export interface Address {
  _id?: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  type?: 'home' | 'work' | 'other';
}

export type UserAddress = Address;

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
  avatar?: string;
  addresses: UserAddress[];
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    orderUpdates: boolean;
    offers: boolean;
  };
  status?: 'active' | 'disabled';
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order?: number;
  isActive?: boolean;
  productCount?: number;
}

export interface ProductVariant {
  name: string;
  sku: string;
  price: number;
  stock: number;
  value?: string;
  attributes?: Record<string, string>;
}

export interface ProductSpecification {
  key: string;
  value: string;
  group?: string;
}

export interface ProductImage {
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

export interface Product {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  category: Category | string | any;
  subcategory?: string;
  brand: string;
  sku: string;
  mrp?: number;
  compareAtPrice?: number;
  sellingPrice?: number;
  price: number;
  discountPercent?: number;
  discountPercentage: number;
  stock: number;
  lowStockThreshold?: number;
  images: any[];
  videoUrl?: string;
  tags?: string[];
  variants?: ProductVariant[];
  specifications?: ProductSpecification[];
  isFeatured?: boolean;
  isPublished: boolean;
  averageRating?: number;
  ratingAverage?: number;
  reviewCount?: number;
  ratingCount?: number;
  totalSold?: number;
  createdAt?: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  variantSku?: string;
  quantity: number;
  price: number;
  mrp?: number;
  discountPercent?: number;
  itemTotal: number;
  inStock?: boolean;
  availableStock?: number;
}

export interface CartData {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  totalMrp?: number;
  discount: number;
  deliveryCharge: number;
  tax: number;
  total: number;
  hasOutOfStock?: boolean;
}

export interface OrderItem {
  product: Product | string | any;
  title?: string;
  name: string;
  image?: string;
  variantSku?: string;
  variant?: { name: string; value: string };
  quantity: number;
  price: number;
  mrp?: number;
  subtotal?: number;
  isReviewed?: boolean;
}

export interface OrderTimeline {
  status: string;
  timestamp: string;
  note?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User | any;
  customerSnapshot?: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: UserAddress;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  discountAmount: number;
  couponDiscount?: number;
  couponCode?: string;
  deliveryCharge?: number;
  shippingFee: number;
  tax?: number;
  taxAmount: number;
  total?: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  orderStatus:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'packed'
    | 'shipped'
    | 'out_for_delivery'
    | 'delivered'
    | 'cancelled'
    | 'return_requested'
    | 'returned'
    | 'refund_pending'
    | 'refunded';
  paymentMethod?: 'razorpay' | 'cod' | 'demo';
  paymentInfo: {
    status: string;
    method: string;
    transactionId?: string;
  };
  paymentDetails?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    paidAt?: string;
  };
  tracking?: {
    trackingId?: string;
    deliveryPartner?: string;
    estimatedDelivery?: string;
    statusTimeline: OrderTimeline[];
  };
  trackingTimeline?: OrderTimeline[];
  shippingCarrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  returnEligibilityUntil?: string;
  adminNotes?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  product: Product | string | any;
  user: User | any;
  rating: number;
  title?: string;
  comment: string;
  media?: string[];
  isVerifiedPurchase: boolean;
  isApproved?: boolean;
  status?: 'published' | 'hidden' | 'flagged';
  adminResponse?: string;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  expiresAt?: string;
  usageLimit?: number;
  usageCount?: number;
  usedCount?: number;
  isActive: boolean;
}

export interface ReturnRequest {
  _id: string;
  order: Order | any;
  user: User | any;
  items?: any[];
  reason: string;
  notes?: string;
  customerComments?: string;
  adminNotes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  createdAt: string;
}

export interface InventoryTransaction {
  _id: string;
  product: Product;
  sku?: string;
  type: string;
  previousStock: number;
  quantityChanged?: number;
  quantity?: number;
  newStock: number;
  reason: string;
  user?: User;
  order?: { orderNumber: string };
  createdAt: string;
}

export interface AdminKPIs {
  totalRevenue: number;
  todaySales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  returnedOrders: number;
  lowStockProducts: number;
  openBugs: number;
  websiteHealth: string;
}

export interface BestSellingProduct {
  product: Product;
  unitsSold: number;
  revenue: number;
}
