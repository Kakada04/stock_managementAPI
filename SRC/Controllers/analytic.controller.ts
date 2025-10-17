import { Request, Response } from "express";
import { Product } from "../Models/Product";
import { Order } from "../Models/Order";
import { User } from "../Models/User";

export const getTotalProduct = async (_req: Request, res: Response) => {
  try {

    // total
    const totalProduct = await Product.countDocuments();

    // total sale
    const totalSales = await Order.countDocuments({ status:"completed" });

    // low stock
    const lowStockCount = await Product.countDocuments({
      $expr: { $lt: ["$quantity", "$minStockThreshold"] }
    });

    // New users (registered recently)
    const newUsers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({ totalProduct, totalSales, lowStockCount, newUsers });
  } catch (error) {
    console.error("Error in getOverview:", error);
    res.status(500).json({ message: "Failed to count products", error });
  }
};
