// src/Controllers/lowstock.controller.ts
import { Request, Response } from "express";
import { Product } from "../Models/Product";

export const getLowStock = async (req: Request, res: Response) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lt: ["$quantity", "$minStockThreshold"] },
    });
    res.status(200).json({ lowStockProducts });
  } catch (error) {
    console.error("Error in getLowStock:", error);
    res.status(500).json({ message: "Failed to get low stock", error });
  }
};
