import { Response } from 'express';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { logAudit } from '../utils/auditLogger.js';

export const getCustomersAdmin = asyncHandler(async (req: any, res: Response) => {
  const { q, status, page = '1', limit = '15' } = req.query;

  const query: any = { role: 'customer' };

  if (q && typeof q === 'string' && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  if (status) query.status = status;

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 15;
  const skip = (pageNum - 1) * limitNum;

  const [customers, total] = await Promise.all([
    User.find(query).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    User.countDocuments(query),
  ]);

  // Aggregate customer order metrics
  const customersWithStats = await Promise.all(
    customers.map(async (cust) => {
      const orders = await Order.find({ user: cust._id, paymentStatus: 'paid' }).select('total createdAt').lean();
      const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
      const lastOrder = orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      return {
        ...cust,
        totalOrders: orders.length,
        totalSpent,
        lastOrderDate: lastOrder?.createdAt || null,
      };
    })
  );

  res.status(200).json({
    success: true,
    customers: customersWithStats,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

export const getCustomerDetailsAdmin = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;

  const customer = await User.findById(id).select('-passwordHash').lean();
  if (!customer) throw new AppError('Customer not found.', 404);

  const orders = await Order.find({ user: id }).sort({ createdAt: -1 }).lean();
  const totalSpent = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  res.status(200).json({
    success: true,
    customer: {
      ...customer,
      totalOrders: orders.length,
      totalSpent,
    },
    orders,
  });
});

export const toggleCustomerStatusAdmin = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'disabled'].includes(status)) {
    throw new AppError('Status must be "active" or "disabled".', 400);
  }

  const customer = await User.findById(id);
  if (!customer) throw new AppError('Customer not found.', 404);

  if (customer.role === 'admin') {
    throw new AppError('Cannot deactivate administrator accounts.', 400);
  }

  customer.status = status;
  await customer.save();

  await logAudit({
    req,
    action: 'TOGGLE_CUSTOMER_STATUS',
    resource: 'User',
    resourceId: id,
    changes: { status },
  });

  res.status(200).json({
    success: true,
    message: `Customer account has been ${status === 'active' ? 'activated' : 'deactivated'}.`,
    customer: {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      status: customer.status,
    },
  });
});
