// src/Models/Product.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  name: string;
  barcode: string;
  price: number;
  categoryId: Types.ObjectId;
  minStockThreshold: number;
  description?: string;
  image?: string;
  quantity: number;
  createdAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  barcode: { type: String, required: true, unique: true },
  price: { type: Number, required: true, min: 0 },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  minStockThreshold: { type: Number, default: 5 },
  description: String,
  image: String,
  quantity: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Product = model<IProduct>("Product", productSchema);
