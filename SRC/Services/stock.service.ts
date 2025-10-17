// src/services/stock.service.ts
import { Types } from 'mongoose';
import { Product } from '../Models/Product';
import { StockLog, IStockLog } from '../Models/StockLog';
import { NotificationService } from './NotificationService';

export class StockService {
  /**
   * Restock a product (increase stock)
   * - Updates product.quantity (aggregate)
   * - NEVER updates product.price
   * - Logs historical productName and current price
   */
  static async restockProduct(
    productId: string,
    quantity: number,
    userId: string,
    reason: string
  ): Promise<{ product: any; log: IStockLog }> {
    // Validate inputs
    if (quantity <= 0) {
      throw new Error('Restock quantity must be greater than zero');
    }
    if (!reason?.trim()) {
      throw new Error('Reason is required');
    }

    // Get current product
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Update aggregate quantity
    const newTotal = product.quantity + quantity;
    product.quantity = newTotal;
    await product.save();

    // Create stock log with HISTORICAL data
    const log = await StockLog.create({
      productId: new Types.ObjectId(productId),
      productName: product.name,        // Current name (for history)
      priceAtTime: product.price,       // Current price (for history)
      action: 'restock',
      quantityChange: quantity,
      newTotalQuantity: newTotal,
      reason: reason.trim(),
      userId: new Types.ObjectId(userId)
    });

    // Emit low-stock alert if needed
    if (newTotal <= (product.minStockThreshold || 5)) {
      NotificationService.emitLowStock(
        product.id.toString(),
        product.name,
        newTotal
      );
    }

    return { product, log };
  }

  /**
   * Manually reduce stock (e.g., damaged goods)
   * - Decreases product.quantity
   * - Uses current product price for historical log
   */
  static async reduceStockManually(
    productId: string,
    quantity: number,
    userId: string,
    reason: string
  ): Promise<{ product: any; log: IStockLog }> {
    if (quantity <= 0) {
      throw new Error('Reduction quantity must be greater than zero');
    }
    if (!reason?.trim()) {
      throw new Error('Reason is required');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const newTotal = product.quantity - quantity;
    if (newTotal < 0) {
      throw new Error(
        `Cannot reduce stock below zero. Current: ${product.quantity}, Attempted: ${quantity}`
      );
    }

    product.quantity = newTotal;
    await product.save();

    const log = await StockLog.create({
      productId: new Types.ObjectId(productId),
      productName: product.name,
      priceAtTime: product.price,
      action: 'adjustment',
      quantityChange: -quantity, // Negative change
      newTotalQuantity: newTotal,
      reason: reason.trim(),
      userId: new Types.ObjectId(userId)
    });

    return { product, log };
  }

  /**
   * Get stock history for a product
   */
  static async getStockHistory(productId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const logs = await StockLog.find({ productId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await StockLog.countDocuments({ productId });

    return {
      logs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    };
  }

  /**
   * Get current stock report (all products)
   */
  static async getStockReport() {
    return await Product.find().populate('categoryId', 'name');
  }
}