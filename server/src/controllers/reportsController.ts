import { Response } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ReturnRequest } from '../models/ReturnRequest.js';
import { asyncHandler, AppError } from '../utils/errors.js';

export const getReportData = asyncHandler(async (req: any, res: Response) => {
  const { type = 'sales', startDate, endDate } = req.query;
  const format = req.query.format || (req.path.includes('export') ? 'csv' : 'json');

  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate as string);
  if (endDate) dateFilter.$lte = new Date(endDate as string);
  const matchDate = startDate || endDate ? { createdAt: dateFilter } : {};

  let data: any[] = [];
  let headers: string[] = [];

  switch (type) {
    case 'sales':
    case 'orders': {
      const orders = await Order.find({ ...matchDate }).sort({ createdAt: -1 }).lean();
      headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Items Count', 'Subtotal', 'Discount', 'Total', 'Payment Status', 'Order Status'];
      data = orders.map((o) => [
        o.orderNumber,
        new Date(o.createdAt).toLocaleDateString(),
        o.customerSnapshot?.name || 'N/A',
        o.customerSnapshot?.email || 'N/A',
        o.items.reduce((s, i) => s + i.quantity, 0),
        o.subtotal,
        o.discount + (o.couponDiscount || 0),
        o.total,
        o.paymentStatus,
        o.orderStatus,
      ]);
      break;
    }
    case 'inventory': {
      const products = await Product.find().select('title sku brand stock lowStockThreshold sellingPrice mrp totalSold').lean();
      headers = ['Product Name', 'SKU', 'Brand', 'Current Stock', 'Low Stock Threshold', 'Selling Price', 'MRP', 'Units Sold', 'Stock Value'];
      data = products.map((p) => [
        `"${p.title.replace(/"/g, '""')}"`,
        p.sku,
        p.brand,
        p.stock,
        p.lowStockThreshold,
        p.sellingPrice,
        p.mrp,
        p.totalSold || 0,
        p.stock * p.sellingPrice,
      ]);
      break;
    }
    case 'customers': {
      const users = await User.find({ role: 'customer' }).select('name email phone status createdAt').lean();
      headers = ['Customer Name', 'Email', 'Phone', 'Account Status', 'Joined Date'];
      data = users.map((u) => [
        `"${u.name.replace(/"/g, '""')}"`,
        u.email,
        u.phone || 'N/A',
        u.status,
        new Date(u.createdAt).toLocaleDateString(),
      ]);
      break;
    }
    case 'returns': {
      const returns = await ReturnRequest.find().populate('order', 'orderNumber').populate('user', 'name email').lean();
      headers = ['Order Number', 'Customer', 'Reason', 'Status', 'Refund Amount', 'Date'];
      data = returns.map((r: any) => [
        r.order?.orderNumber || 'N/A',
        r.user?.name || 'N/A',
        r.reason,
        r.status,
        r.refundAmount || 0,
        new Date(r.createdAt).toLocaleDateString(),
      ]);
      break;
    }
    default:
      throw new AppError(`Unknown report type: ${type}`, 400);
  }

  // If CSV export is requested:
  if (format === 'csv') {
    const csvRows = [
      headers.join(','),
      ...data.map((row) => row.join(',')),
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="aura_report_${type}_${Date.now()}.csv"`);
    return res.status(200).send(csvRows.join('\n'));
  }

  res.status(200).json({
    success: true,
    reportType: type,
    headers,
    rows: data,
    recordCount: data.length,
  });
});
