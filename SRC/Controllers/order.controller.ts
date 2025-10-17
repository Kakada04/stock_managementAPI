// src/controllers/order.controller.ts
import { Response } from 'express';
import mongoose, { ClientSession } from 'mongoose';
import { Order } from '../Models/Order';
import { Product } from '../Models/Product';
import { User } from '../Models/User';
import { AuthRequest } from '../Middleware/auth'; // ✅ so we can access req.user

interface OrderItemInput {
  productId: string;
  quantity: number;
}

// ---------------------------------------------------
// ✅ Create Order
// ---------------------------------------------------
export async function createOrder(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const userId = req.user?._id;
    const { items } = req.body as { items: OrderItemInput[] };

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const orderItems: any[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.quantity < item.quantity) {
        return res
          .status(400)
          .json({ error: `Not enough stock for product ${item.productId}` });
      }

      // if (!product) {
      //   return res
      //     .status(400)
      //     .json({ error: `Not enough stock for product ${it.quantity}` });
      // }

      product.quantity -= item.quantity;
      await product.save();

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });

      totalAmount += product.price * item.quantity;
    }

    const order = new Order({
      userId,
      items: orderItems,
      totalAmount,
      status: 'completed',
    });

    const savedOrder = await order.save();

    const populated = await Order.findById(savedOrder._id)
      .populate('items.productId', 'name')
      .populate('userId', 'name email');

    return res.status(201).json({ order: populated });
  } catch (err) {
    console.error('createOrder error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


// ---------------------------------------------------
// ✅ Get Order By ID
// ---------------------------------------------------
export async function getOrderById(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('items.productId', 'name price')
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ order });
  } catch (err) {
    console.error('getOrderById error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------------------------------------------
// ✅ List All Orders (with pagination)
// ---------------------------------------------------
export async function listOrders(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name')
      .populate('items.productId', 'name');

    return res.json({ page, limit, orders });
  } catch (err) {
    console.error('listOrders error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
