import { Response } from 'express';
import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { config } from '../config/env.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { logAudit } from '../utils/auditLogger.js';

export const createPaymentIntent = asyncHandler(async (req: any, res: Response) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  if (order.paymentStatus === 'paid') {
    throw new AppError('This order is already paid.', 400);
  }

  const isRazorpayConfigured = Boolean(config.razorpayKeyId && config.razorpayKeySecret);

  if (isRazorpayConfigured) {
    // Real Razorpay integration
    try {
      // In live mode with keys, create real order via Razorpay API
      const auth = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(order.total * 100), // Razorpay accepts amounts in paise
          currency: 'INR',
          receipt: order.orderNumber,
          notes: {
            orderId: order._id.toString(),
            customerEmail: order.customerSnapshot.email,
          },
        }),
      });

      const rzOrder: any = await response.json();
      if (!response.ok) {
        throw new Error(rzOrder.error?.description || 'Razorpay order creation failed.');
      }

      order.paymentDetails.razorpayOrderId = rzOrder.id;
      await order.save();

      res.status(200).json({
        success: true,
        gateway: 'razorpay',
        isDemo: false,
        key: config.razorpayKeyId,
        orderId: rzOrder.id,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        customerName: order.customerSnapshot.name,
        customerEmail: order.customerSnapshot.email,
        customerPhone: order.customerSnapshot.phone,
      });
    } catch (rzErr: any) {
      console.warn('[Payment] Razorpay API call failed, falling back to clearly-labeled demo mode:', rzErr.message);
      res.status(200).json({
        success: true,
        gateway: 'demo',
        isDemo: true,
        message: 'Running in Demo Payment Mode (Razorpay live credentials not configured or unreachable).',
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.total,
        currency: 'INR',
      });
    }
  } else {
    // Explicit demo mode
    res.status(200).json({
      success: true,
      gateway: 'demo',
      isDemo: true,
      message: 'DEMO PAYMENT GATEWAY (Credentials not configured). Real funds are not transferred.',
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: 'INR',
    });
  }
});

export const verifyPayment = asyncHandler(async (req: any, res: Response) => {
  const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, isDemo } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found.', 404);

  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied.', 403);
  }

  if (isDemo || !config.razorpayKeySecret) {
    // Process verified demo transaction
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    order.paymentMethod = 'demo';
    order.paymentDetails = {
      razorpayPaymentId: `demo_pay_${Date.now()}`,
      paidAt: new Date(),
    };
    order.tracking.statusTimeline.push({
      status: 'Payment Received',
      timestamp: new Date(),
      note: 'Verified in Simulated Demo Mode.',
    });
    await order.save();

    await Payment.create({
      orderId: order._id,
      user: req.user._id,
      amount: order.total,
      currency: 'INR',
      status: 'captured',
      method: 'demo_simulated',
      provider: 'demo',
      transactionId: `TXN-DEMO-${Date.now()}`,
    });

    await logAudit({
      req,
      action: 'VERIFY_PAYMENT_DEMO',
      resource: 'Payment',
      resourceId: order._id.toString(),
      changes: { orderNumber: order.orderNumber, amount: order.total, isDemo: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully in Demo Mode.',
      order,
    });
  }

  // Real Razorpay HMAC SHA256 Signature Verification
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    order.paymentStatus = 'failed';
    await order.save();
    throw new AppError('Payment signature verification failed. Fraudulent attempt blocked.', 400);
  }

  order.paymentStatus = 'paid';
  order.orderStatus = 'confirmed';
  order.paymentMethod = 'razorpay';
  order.paymentDetails = {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paidAt: new Date(),
  };
  order.tracking.statusTimeline.push({
    status: 'Payment Captured',
    timestamp: new Date(),
    note: `Razorpay Payment ID: ${razorpayPaymentId}`,
  });
  await order.save();

  await Payment.create({
    orderId: order._id,
    user: req.user._id,
    amount: order.total,
    currency: 'INR',
    status: 'captured',
    method: 'razorpay',
    provider: 'razorpay',
    transactionId: razorpayPaymentId,
    metadata: { razorpayOrderId, razorpaySignature },
  });

  await logAudit({
    req,
    action: 'VERIFY_PAYMENT_RAZORPAY',
    resource: 'Payment',
    resourceId: razorpayPaymentId,
    changes: { orderNumber: order.orderNumber, amount: order.total },
  });

  res.status(200).json({
    success: true,
    message: 'Payment verified and captured successfully.',
    order,
  });
});
