import { Response } from 'express';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { Coupon } from '../models/Coupon.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { Notification } from '../models/Notification.js';
import { ReturnRequest } from '../models/ReturnRequest.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { checkoutSchema, updateOrderStatusSchema, VALID_ORDER_TRANSITIONS } from '../validators/orderValidators.js';
import { logAudit } from '../utils/auditLogger.js';

export const formatOrderResponse = (order: any) => {
  if (!order) return order;
  const doc = typeof order.toObject === 'function' ? order.toObject() : { ...order };
  const totalAmount = doc.total ?? 0;
  const shippingFee = doc.deliveryCharge ?? 0;
  const taxAmount = doc.tax ?? 0;
  const discountAmount = (doc.discount ?? 0) + (doc.couponDiscount ?? 0);
  const paymentInfo = {
    status: doc.paymentStatus === 'paid' ? 'completed' : doc.paymentStatus || 'pending',
    method: doc.paymentMethod || 'demo',
    transactionId: doc.paymentDetails?.razorpayPaymentId || `DEMO_TXN_${String(doc._id || '').slice(-6)}`,
  };
  const rawEst = doc.tracking?.estimatedDelivery ? new Date(doc.tracking.estimatedDelivery) : new Date(Date.now() + 4 * 86400000);
  const formattedDelivery = rawEst.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const estimatedDelivery = `Arriving by ${formattedDelivery}`;
  const trackingNumber = doc.tracking?.trackingNumber || doc.trackingNumber || `BLUEDART-${Math.floor(100000000 + Math.random() * 900000000)}`;
  const shippingCarrier = doc.tracking?.carrier || doc.shippingCarrier || 'BlueDart Logistics';
  const trackingTimeline = doc.tracking?.statusTimeline || [];
  const items = (doc.items || []).map((item: any) => ({
    ...item,
    name: item.name || item.title || 'Product Item',
    title: item.title || item.name || 'Product Item',
  }));

  return {
    ...doc,
    totalAmount,
    shippingFee,
    taxAmount,
    discountAmount,
    paymentInfo,
    estimatedDelivery,
    trackingNumber,
    shippingCarrier,
    trackingTimeline,
    items,
  };
};

export const createOrder = asyncHandler(async (req: any, res: Response) => {
  const { shippingAddress, couponCode, paymentMethod } = checkoutSchema.parse(req.body);

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty. Please add products before checking out.', 400);
  }

  // 1. Re-validate stock and prices on server side
  let subtotal = 0;
  let totalMrp = 0;
  const orderItems: any[] = [];

  for (const item of cart.items as any[]) {
    const product = await Product.findById(item.product._id);
    if (!product || !product.isPublished) {
      throw new AppError(`Product "${item.product.title}" is no longer available.`, 400);
    }

    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${product.title}". Available: ${product.stock}, in cart: ${item.quantity}.`,
        400
      );
    }

    const itemSubtotal = product.sellingPrice * item.quantity;
    subtotal += itemSubtotal;
    totalMrp += product.mrp * item.quantity;

    orderItems.push({
      product: product._id,
      title: product.title,
      image: product.images[0] || '',
      variantSku: item.variantSku || product.sku,
      quantity: item.quantity,
      price: product.sellingPrice,
      mrp: product.mrp,
      subtotal: itemSubtotal,
    });
  }

  // 2. Validate Coupon server-side
  let couponDiscount = 0;
  let validatedCouponCode = '';

  if (couponCode && couponCode.trim()) {
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      isActive: true,
    });

    if (coupon) {
      const now = new Date();
      if (now >= coupon.validFrom && now <= coupon.validUntil && coupon.usageCount < coupon.usageLimit) {
        if (subtotal >= coupon.minOrderAmount) {
          if (coupon.discountType === 'percentage') {
            couponDiscount = Math.round((subtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscountAmount && couponDiscount > coupon.maxDiscountAmount) {
              couponDiscount = coupon.maxDiscountAmount;
            }
          } else {
            couponDiscount = Math.min(coupon.discountValue, subtotal);
          }
          validatedCouponCode = coupon.code;
          coupon.usageCount += 1;
          await coupon.save();
        }
      }
    }
  }

  const deliveryCharge = subtotal > 999 ? 0 : 99;
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const discount = totalMrp - subtotal;
  const total = Math.max(0, subtotal - couponDiscount + deliveryCharge + tax);

  // Generate unique order number: ORD-YYYYMMDD-XXXX
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ORD-${dateStr}-${randNum}`;

  const isDemo = paymentMethod === 'demo';
  const initialPaymentStatus = isDemo ? 'paid' : paymentMethod === 'cod' ? 'pending' : 'pending';
  const initialOrderStatus = isDemo ? 'confirmed' : 'pending';

    // Dynamic delivery estimate: random 3 to 5 days in the future
    const randomDays = Math.floor(Math.random() * 3) + 3;
    const estimatedDelivery = new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000);

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      customerSnapshot: {
        name: shippingAddress.name,
        email: req.user.email,
        phone: shippingAddress.phone || req.user.phone || '',
      },
      shippingAddress,
      items: orderItems,
      subtotal,
      discount,
      couponDiscount,
      couponCode: validatedCouponCode,
      deliveryCharge,
      tax,
      total,
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus,
      paymentMethod,
      paymentDetails: {
        paidAt: isDemo ? new Date() : undefined,
      },
      tracking: {
        trackingId: `BLUEDART-${Math.floor(10000000 + Math.random() * 90000000)}`,
        deliveryPartner: 'BlueDart Express',
        estimatedDelivery,
        statusTimeline: [
          {
            status: 'Order Placed',
            timestamp: new Date(),
            note: isDemo ? 'Payment verified in simulated demo mode.' : 'Order placed successfully.',
          },
          ...(isDemo
            ? [
                {
                  status: 'Confirmed',
                  timestamp: new Date(Date.now() + 1000),
                  note: `Order confirmed. Estimated delivery by ${estimatedDelivery.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}.`,
                },
              ]
            : []),
        ],
      },
      returnEligibilityUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days return window
    });

  // 3. Deduct stock and record inventory transaction
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      const prev = product.stock;
      product.stock = Math.max(0, product.stock - item.quantity);
      product.totalSold = (product.totalSold || 0) + item.quantity;
      await product.save();

      await InventoryTransaction.create({
        product: product._id,
        sku: item.variantSku || product.sku,
        type: 'sale',
        previousStock: prev,
        quantityChanged: -item.quantity,
        newStock: product.stock,
        reason: `Order ${order.orderNumber} placed`,
        user: req.user._id,
        order: order._id,
      });

      // Low stock notification to admin
      if (product.stock <= product.lowStockThreshold) {
        await Notification.create({
          recipient: null, // Broadcast to all admins
          title: 'Low Stock Alert',
          message: `Product "${product.title}" has only ${product.stock} units remaining.`,
          type: 'inventory',
          link: `/admin/inventory`,
        });
      }
    }
  }

  // 4. Clear cart
  cart.items = [];
  await cart.save();

  // 5. Create notifications
  await Notification.create({
    recipient: req.user._id,
    title: 'Order Confirmed',
    message: `Your order #${order.orderNumber} has been received and confirmed.`,
    type: 'order',
    link: `/account/orders/${order._id}`,
  });

  await Notification.create({
    recipient: null,
    title: 'New Customer Order',
    message: `New order #${order.orderNumber} received for ₹${order.total.toLocaleString('en-IN')}.`,
    type: 'order',
    link: `/admin/orders/${order._id}`,
  });

  await logAudit({
    req,
    action: 'CREATE_ORDER',
    resource: 'Order',
    resourceId: order._id.toString(),
    changes: { orderNumber: order.orderNumber, total: order.total },
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully.',
    order: formatOrderResponse(order),
  });
});

export const getMyOrders = asyncHandler(async (req: any, res: Response) => {
  const { page = '1', limit = '10' } = req.query;
  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    orders: orders.map(formatOrderResponse),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

export const getOrderById = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;

  const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: id } : { orderNumber: id };

  const order = await Order.findOne(query).populate('items.product', 'title slug images').lean();
  if (!order) throw new AppError('Order not found.', 404);

  // Security check: customer can only access their own order
  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  res.status(200).json({
    success: true,
    order: formatOrderResponse(order),
  });
});

export const cancelOrder = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { reason = 'Cancelled by customer' } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found.', 404);

  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  const cancelableStatuses = ['pending', 'confirmed', 'processing', 'packed'];
  if (!cancelableStatuses.includes(order.orderStatus)) {
    throw new AppError(`Cannot cancel order at "${order.orderStatus}" stage.`, 400);
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = reason;
  order.tracking.statusTimeline.push({
    status: 'Cancelled',
    timestamp: new Date(),
    note: reason,
  });

  // Restore inventory
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      const prev = product.stock;
      product.stock += item.quantity;
      product.totalSold = Math.max(0, (product.totalSold || 0) - item.quantity);
      await product.save();

      await InventoryTransaction.create({
        product: product._id,
        sku: item.variantSku || product.sku,
        type: 'cancellation_restored',
        previousStock: prev,
        quantityChanged: item.quantity,
        newStock: product.stock,
        reason: `Restored from cancelled order #${order.orderNumber}`,
        user: req.user._id,
        order: order._id,
      });
    }
  }

  await order.save();

  await logAudit({
    req,
    action: 'CANCEL_ORDER',
    resource: 'Order',
    resourceId: order._id.toString(),
    changes: { reason },
  });

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully and stock restored.',
    order,
  });
});

export const submitReturnRequest = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { itemProductId, reason, notes, images = [] } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found.', 404);

  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  if (order.orderStatus !== 'delivered') {
    throw new AppError('Return can only be requested for delivered orders.', 400);
  }

  if (order.returnEligibilityUntil && new Date() > order.returnEligibilityUntil) {
    throw new AppError('The 7-day return eligibility window for this order has expired.', 400);
  }

  const targetItem = order.items.find((i) => i.product.toString() === itemProductId);
  if (!targetItem) throw new AppError('Item not found in this order.', 404);

  const returnReq = await ReturnRequest.create({
    order: order._id,
    user: req.user._id,
    item: {
      product: targetItem.product,
      variantSku: targetItem.variantSku,
      quantity: targetItem.quantity,
      price: targetItem.price,
    },
    reason,
    notes: notes || '',
    images,
    refundAmount: targetItem.subtotal,
  });

  order.orderStatus = 'return_requested';
  order.tracking.statusTimeline.push({
    status: 'Return Requested',
    timestamp: new Date(),
    note: `Reason: ${reason}`,
  });
  await order.save();

  // Notify admin
  await Notification.create({
    recipient: null,
    title: 'Return Request Submitted',
    message: `Return requested for order #${order.orderNumber} (${reason}).`,
    type: 'return',
    link: `/admin/returns`,
  });

  res.status(201).json({
    success: true,
    message: 'Return request submitted successfully.',
    returnRequest: returnReq,
  });
});

// Admin Order Management
export const getAllOrdersAdmin = asyncHandler(async (req: any, res: Response) => {
  const {
    q,
    orderStatus,
    paymentStatus,
    startDate,
    endDate,
    page = '1',
    limit = '15',
    sort = 'newest',
  } = req.query;

  const query: any = {};

  if (q && typeof q === 'string' && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    query.$or = [
      { orderNumber: regex },
      { 'customerSnapshot.name': regex },
      { 'customerSnapshot.email': regex },
      { 'customerSnapshot.phone': regex },
    ];
  }

  if (orderStatus) query.orderStatus = orderStatus;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate as string);
    if (endDate) query.createdAt.$lte = new Date(endDate as string);
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 15;
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', 'name email phone avatar')
      .lean(),
    Order.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    orders: orders.map(formatOrderResponse),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

export const updateOrderStatusAdmin = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { status, trackingId, deliveryPartner, note, adminNotes } = updateOrderStatusSchema.parse(req.body);

  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found.', 404);

  // Validate state transitions
  const currentStatus = order.orderStatus;
  if (status !== currentStatus) {
    const allowed = VALID_ORDER_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      throw new AppError(
        `Invalid status transition from "${currentStatus}" to "${status}". Allowed next steps: ${allowed.join(', ') || 'None (terminal)'}`,
        400
      );
    }
  }

  order.orderStatus = status;

  if (trackingId) order.tracking.trackingId = trackingId;
  if (deliveryPartner) order.tracking.deliveryPartner = deliveryPartner;
  if (adminNotes !== undefined) order.adminNotes = adminNotes;

  // Add status timeline entry
  const displayStatus = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  order.tracking.statusTimeline.push({
    status: displayStatus,
    timestamp: new Date(),
    note: note || `Order status updated to ${displayStatus}`,
  });

  // If delivered, mark payment as paid if COD
  if (status === 'delivered') {
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.paymentDetails.paidAt = new Date();
    }
    if (!order.returnEligibilityUntil) {
      order.returnEligibilityUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  await order.save();

  // Notify customer
  await Notification.create({
    recipient: order.user,
    title: `Order ${displayStatus}`,
    message: `Your order #${order.orderNumber} is now ${displayStatus.toLowerCase()}.`,
    type: 'order',
    link: `/account/orders/${order._id}`,
  });

  await logAudit({
    req,
    action: 'UPDATE_ORDER_STATUS',
    resource: 'Order',
    resourceId: order._id.toString(),
    changes: { previousStatus: currentStatus, newStatus: status, trackingId },
  });

  res.status(200).json({
    success: true,
    message: `Order status updated to ${displayStatus}.`,
    order,
  });
});

export const recordRefundAdmin = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { refundAmount, note, restock = true } = req.body;

  const order = await Order.findById(id);
  if (!order) throw new AppError('Order not found.', 404);

  order.paymentStatus = 'refunded';
  order.orderStatus = 'refunded';
  order.tracking.statusTimeline.push({
    status: 'Refund Completed',
    timestamp: new Date(),
    note: note || `Refund of ₹${refundAmount || order.total} processed explicitly.`,
  });

  if (restock) {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const prev = product.stock;
        product.stock += item.quantity;
        await product.save();

        await InventoryTransaction.create({
          product: product._id,
          sku: item.variantSku || product.sku,
          type: 'return_restored',
          previousStock: prev,
          quantityChanged: item.quantity,
          newStock: product.stock,
          reason: `Restocked from refunded order #${order.orderNumber}`,
          user: req.user._id,
          order: order._id,
        });
      }
    }
  }

  await order.save();

  await Notification.create({
    recipient: order.user,
    title: 'Refund Processed',
    message: `A refund of ₹${refundAmount || order.total} for order #${order.orderNumber} has been recorded.`,
    type: 'refund' as any,
    link: `/account/orders/${order._id}`,
  });

  await logAudit({
    req,
    action: 'RECORD_REFUND',
    resource: 'Order',
    resourceId: order._id.toString(),
    changes: { refundAmount: refundAmount || order.total, restock },
  });

  res.status(200).json({
    success: true,
    message: 'Refund recorded and stock updated.',
    order,
  });
});

export const getReturnRequestsAdmin = asyncHandler(async (req: any, res: Response) => {
  const returnRequests = await ReturnRequest.find()
    .populate('order', 'orderNumber total paymentStatus orderStatus createdAt')
    .populate('user', 'name email phone')
    .populate('item.product', 'title sku images sellingPrice')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    returnRequests,
  });
});

export const updateReturnRequestAdmin = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  const returnReq = await ReturnRequest.findById(id);
  if (!returnReq) throw new AppError('Return request not found.', 404);

  if (status) returnReq.status = status;
  if (adminNotes !== undefined) returnReq.adminNotes = adminNotes;
  if (status === 'refund_completed') returnReq.refundedAt = new Date();

  await returnReq.save();

  const order = await Order.findById(returnReq.order);
  if (order) {
    if (status === 'approved') {
      order.orderStatus = 'returned';
    } else if (status === 'refund_completed') {
      order.orderStatus = 'refunded';
      order.paymentStatus = 'refunded';
    }
    order.tracking.statusTimeline.push({
      status: `Return: ${status.replace(/_/g, ' ').toUpperCase()}`,
      timestamp: new Date(),
      note: adminNotes || `Return request status updated to ${status}`,
    });
    await order.save();
  }

  await logAudit({
    req,
    action: 'UPDATE_RETURN_STATUS',
    resource: 'ReturnRequest',
    resourceId: id,
    changes: { status, adminNotes },
  });

  res.status(200).json({
    success: true,
    message: `Return request updated to ${status}.`,
    returnRequest: returnReq,
  });
});
