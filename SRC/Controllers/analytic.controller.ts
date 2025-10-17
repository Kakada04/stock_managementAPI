import { Request, Response } from "express";
import { Product } from "../Models/Product";
import { Order } from "../Models/Order";

export const getTotalProduct = async (_req: Request, res: Response) => {
  try {

    // total
    const totalProduct = await Product.countDocuments();

    // total sale
    const totalSales = await Order.countDocuments({ status:"completed" });

    // low stock
    const lowStockCount = await Product.countDocuments({stock: { $lt: 5 }});

    // new order
    const newOrders = await Order.countDocuments({ status:"pedding" })
    res.status(200).json({ totalProduct, totalSales, lowStockCount, newOrders });
  } catch (error) {
    console.error("Error in getOverview:", error);
    res.status(500).json({ message: "Failed to count products", error });
  }
};
