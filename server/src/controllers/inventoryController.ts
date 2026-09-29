import { Response } from 'express';
import { Product } from '../models/Product.js';
import { InventoryTransaction } from '../models/InventoryTransaction.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { logAudit } from '../utils/auditLogger.js';

export const getInventoryOverview = asyncHandler(async (req: any, res: Response) => {
  const { filter, q, page = '1', limit = '15' } = req.query;

  const query: any = { isPublished: true };

  if (q && typeof q === 'string' && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    query.$or = [{ title: regex }, { sku: regex }, { brand: regex }];
  }

  if (filter === 'low_stock') {
    query.$expr = {
      $and: [
        { $gt: ['$stock', 0] },
        { $lte: ['$stock', '$lowStockThreshold'] },
      ],
    };
  } else if (filter === 'out_of_stock') {
    query.stock = { $lte: 0 };
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 15;
  const skip = (pageNum - 1) * limitNum;

  const [products, total, totalStockResult, lowStockCount, outOfStockCount] = await Promise.all([
    Product.find(query)
      .select('title sku brand stock lowStockThreshold sellingPrice mrp images variants')
      .sort({ stock: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(query),
    Product.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: null, totalUnits: { $sum: '$stock' }, totalValue: { $sum: { $multiply: ['$stock', '$sellingPrice'] } } } },
    ]),
    Product.countDocuments({
      isPublished: true,
      $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] },
    }),
    Product.countDocuments({ isPublished: true, stock: { $lte: 0 } }),
  ]);

  res.status(200).json({
    success: true,
    products,
    stats: {
      totalUnits: totalStockResult[0]?.totalUnits || 0,
      totalInventoryValue: totalStockResult[0]?.totalValue || 0,
      lowStockCount,
      outOfStockCount,
    },
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

export const adjustStock = asyncHandler(async (req: any, res: Response) => {
  const { productId, sku, adjustmentType, quantity, reason } = req.body;

  if (!productId || !adjustmentType || typeof quantity !== 'number' || quantity <= 0) {
    throw new AppError('Product ID, adjustment type (add/remove/set), and positive quantity are required.', 400);
  }
  if (!reason || !reason.trim()) {
    throw new AppError('Reason for stock adjustment is required.', 400);
  }

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found.', 404);

  const prevStock = product.stock;
  let newStock = prevStock;
  let quantityChanged = 0;

  if (adjustmentType === 'add') {
    newStock = prevStock + quantity;
    quantityChanged = quantity;
  } else if (adjustmentType === 'remove') {
    if (quantity > prevStock) {
      throw new AppError(`Cannot remove ${quantity} units. Current stock is only ${prevStock}.`, 400);
    }
    newStock = prevStock - quantity;
    quantityChanged = -quantity;
  } else if (adjustmentType === 'set') {
    newStock = quantity;
    quantityChanged = quantity - prevStock;
  } else {
    throw new AppError('Invalid adjustmentType. Use "add", "remove", or "set".', 400);
  }

  product.stock = newStock;
  await product.save();

  // Create immutable InventoryTransaction record
  const transaction = await InventoryTransaction.create({
    product: product._id,
    sku: sku || product.sku,
    type: adjustmentType === 'add' ? 'restock' : 'adjustment',
    previousStock: prevStock,
    quantityChanged,
    newStock,
    reason,
    user: req.user._id,
  });

  await logAudit({
    req,
    action: 'ADJUST_STOCK',
    resource: 'Inventory',
    resourceId: product._id.toString(),
    changes: { previousStock: prevStock, newStock, quantityChanged, reason },
  });

  res.status(200).json({
    success: true,
    message: `Stock updated from ${prevStock} to ${newStock}.`,
    product: {
      _id: product._id,
      title: product.title,
      sku: product.sku,
      stock: product.stock,
    },
    transaction,
  });
});

export const getInventoryTransactions = asyncHandler(async (req: any, res: Response) => {
  const { productId, page = '1', limit = '20' } = req.query;

  const query: any = {};
  if (productId) query.product = productId;

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    InventoryTransaction.find(query)
      .populate('product', 'title sku images')
      .populate('user', 'name email role')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    InventoryTransaction.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    transactions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});
