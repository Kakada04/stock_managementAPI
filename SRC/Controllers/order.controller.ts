import { Response } from 'express';
import { Order } from '../Models/Order';
import { Product } from '../Models/Product';
import { User } from '../Models/User';
import { AuthRequest } from '../Middleware/auth';
import { Category } from '../Models/Category';

interface OrderItemInput {
  productId: string;
  quantity: number;
}

// ---------------------------------------------------
// ✅ Create Order (Enhanced)
// ---------------------------------------------------
export async function createOrder(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const userId = req.user?._id;
    const { items } = req.body as { items: OrderItemInput[] };

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orderItems: any[] = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId).populate('categoryId', 'name');
      if (!product || product.quantity < item.quantity) {
        return res
          .status(400)
          .json({ error: `Not enough stock for product ${item.productId}` });
      }

      // Get category name
      const categoryName = (product as any).categoryId?.name || 'Uncategorized';

      product.quantity -= item.quantity;
      await product.save();

      orderItems.push({
        productId: product._id,
        productName: product.name,
        productCategory: categoryName,
        quantity: item.quantity,
        price: product.price,
      });

      totalAmount += product.price * item.quantity;
    }

    const order = new Order({
      userId,
      userName: user.name,
      userEmail: user.email,
      items: orderItems,
      totalAmount,
      status: 'completed',
    });

    const savedOrder = await order.save();
    return res.status(201).json({ order: savedOrder });
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
    const order = await Order.findById(id);

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

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments();

    return res.json({ 
      page, 
      limit, 
      total,
      orders 
    });
  } catch (err) {
    console.error('listOrders error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------------------------------------------
// ✅ Sales Analytics Endpoints
// ---------------------------------------------------
// ---------------------------------------------------
// ✅ Unified Sales Analytics for Chart.js
// ---------------------------------------------------
export async function getSalesByPeriod(req: AuthRequest, res: Response): Promise<Response> {
  try {
    const now = new Date();

    // Utility to aggregate sales by period type
    async function aggregateSales(period: 'day' | 'week' | 'month') {
      const startDate = new Date();

      if (period === 'day') startDate.setDate(now.getDate() - 1); // last 24 hours
      else if (period === 'week') startDate.setDate(now.getDate() - 7);
      else if (period === 'month') startDate.setMonth(now.getMonth() - 6);

      let groupConfig: any;
      let dateField = '$createdAt';

      if (period === 'day') {
        // Group by hour
        groupConfig = {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField },
          hour: { $hour: dateField },
        };
      } else if (period === 'week') {
        // Group by day of week
        groupConfig = { dayOfWeek: { $dayOfWeek: dateField } };
      } else {
        // Group by month
        groupConfig = {
          year: { $year: dateField },
          month: { $month: dateField },
        };
      }

      const sales = await Order.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: groupConfig,
            totalSales: { $sum: '$totalAmount' },
            date: { $first: '$createdAt' },
          },
        },
        { $sort: { date: 1 } },
      ]);

      // --- Format labels + data ---
      let labels: string[] = [];
      let data: number[] = [];

      if (period === 'day') {
        // Fill 24-hour slots (0–23)
        for (let h = 0; h < 24; h++) {
          const label =
            h === 0
              ? '12 AM'
              : h < 12
              ? `${h} AM`
              : h === 12
              ? '12 PM'
              : `${h - 12} PM`;

          const match = sales.find((s) => s._id.hour === h);
          labels.push(label);
          data.push(match ? match.totalSales : 0);
        }
      } else if (period === 'week') {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 1; i <= 7; i++) {
          const label = dayNames[i - 1];
          const match = sales.find((s) => s._id.dayOfWeek === i);
          labels.push(label);
          data.push(match ? match.totalSales : 0);
        }
      } else if (period === 'month') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 0; i < 12; i++) {
          const month = i + 1;
          const label = monthNames[i];
          const match = sales.find((s) => s._id.month === month);
          labels.push(label);
          data.push(match ? match.totalSales : 0);
        }
      }

      return { labels, data };
    }

    // Build all periods
    const [day, week, month] = await Promise.all([
      aggregateSales('day'),
      aggregateSales('week'),
      aggregateSales('month'),
    ]);

    return res.json({ day, week, month });
  } catch (err) {
    console.error('getSalesByPeriod error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
