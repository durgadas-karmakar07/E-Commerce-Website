import { Response } from 'express';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { IssueReference } from '../models/IssueReference.js';
import { ReturnRequest } from '../models/ReturnRequest.js';
import { asyncHandler } from '../utils/errors.js';

export const getDashboardKpis = asyncHandler(async (req: any, res: Response) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalCustomers,
    totalOrders,
    totalProducts,
    todayOrders,
    revenueResult,
    pendingOrders,
    returnedOrders,
    lowStockProducts,
    openBugs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments(),
    Product.countDocuments({ isPublished: true }),
    Order.find({ createdAt: { $gte: todayStart }, paymentStatus: 'paid' }).select('total'),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalDiscounts: { $sum: '$discount' } } },
    ]),
    Order.countDocuments({ orderStatus: { $in: ['pending', 'processing', 'packed'] } }),
    ReturnRequest.countDocuments({ status: { $in: ['requested', 'approved', 'item_received'] } }),
    Product.countDocuments({
      isPublished: true,
      $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] },
    }),
    IssueReference.countDocuments({ status: { $in: ['open', 'investigating'] } }),
  ]);

  const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  // Real Website Health status
  const websiteHealth = openBugs > 5 ? 'Degraded' : 'Healthy';

  res.status(200).json({
    success: true,
    kpis: {
      totalUsers,
      totalCustomers,
      totalOrders,
      totalProducts,
      todaySales,
      totalRevenue,
      pendingOrders,
      returnedOrders,
      lowStockProducts,
      openBugs,
      websiteHealth,
    },
  });
});

export const getRevenueAnalytics = asyncHandler(async (req: any, res: Response) => {
  const { period = 'month' } = req.query; // 'week' | 'month' | 'year'

  const now = new Date();
  let startDate = new Date();
  let groupFormat = '%Y-%m-%d';

  if (period === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    groupFormat = '%Y-%m-%d';
  } else if (period === 'month') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    groupFormat = '%Y-%m-%d';
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    groupFormat = '%Y-%m';
  }

  // Real aggregate calculation from paid orders
  const revenueData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        paymentStatus: { $in: ['paid', 'refunded'] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        grossSales: { $sum: '$subtotal' },
        discounts: { $sum: '$discount' },
        couponDiscounts: { $sum: '$couponDiscount' },
        refunds: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, '$total', 0],
          },
        },
        netSales: {
          $sum: {
            $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0],
          },
        },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Aggregate summary totals
  const summary = revenueData.reduce(
    (acc, cur) => {
      acc.totalGross += cur.grossSales;
      acc.totalDiscounts += cur.discounts + cur.couponDiscounts;
      acc.totalRefunds += cur.refunds;
      acc.totalNet += cur.netSales;
      acc.totalOrders += cur.orderCount;
      return acc;
    },
    { totalGross: 0, totalDiscounts: 0, totalRefunds: 0, totalNet: 0, totalOrders: 0 }
  );

  const averageOrderValue =
    summary.totalOrders > 0 ? Math.round(summary.totalNet / summary.totalOrders) : 0;

  res.status(200).json({
    success: true,
    period,
    chartData: revenueData.map((d) => ({
      date: d._id,
      grossSales: d.grossSales,
      discounts: d.discounts + d.couponDiscounts,
      refunds: d.refunds,
      netSales: d.netSales,
      orders: d.orderCount,
    })),
    summary: {
      ...summary,
      averageOrderValue,
    },
  });
});

export const getBestSellingAnalytics = asyncHandler(async (req: any, res: Response) => {
  // Aggregate real line items from orders
  const bestSellers = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        unitsSold: { $sum: '$items.quantity' },
        revenueGenerated: { $sum: '$items.subtotal' },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails',
      },
    },
    { $unwind: '$productDetails' },
    {
      $project: {
        _id: 1,
        title: '$productDetails.title',
        sku: '$productDetails.sku',
        image: { $arrayElemAt: ['$productDetails.images', 0] },
        currentStock: '$productDetails.stock',
        rating: '$productDetails.averageRating',
        reviewCount: '$productDetails.reviewCount',
        unitsSold: 1,
        revenueGenerated: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    bestSellers,
  });
});

export const getCustomerAnalytics = asyncHandler(async (req: any, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalCustomers, newCustomers, orderDistribution] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: thirtyDaysAgo } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
    ]),
  ]);

  const returningCustomers = orderDistribution.filter((u) => u.orderCount > 1).length;
  const activeCustomers = orderDistribution.length;

  res.status(200).json({
    success: true,
    customerMetrics: {
      totalCustomers,
      newCustomers,
      activeCustomers,
      returningCustomers,
      repeatCustomerRate: activeCustomers > 0 ? Math.round((returningCustomers / activeCustomers) * 100) : 0,
    },
  });
});
