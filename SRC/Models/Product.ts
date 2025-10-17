// src/models/Product.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  categoryId: Types.ObjectId;
  price: number;
  quantity: number;
  minStockThreshold?: number; // for low-stock alerts
  barcode: string; // unique
  description?: string;
  image?: string; // URL
  createdAt: Date;
  stock: number;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  categoryId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  minStockThreshold: { type: Number, default: 5 },
  barcode: { type: String, required: true, unique: true },
  description: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
});

export const Product = model<IProduct>('Product', productSchema);