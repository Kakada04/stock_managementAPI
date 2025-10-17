// src/models/Product.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  barcode: string;
  price: number; // Current selling price (editable separately)
  categoryId: Types.ObjectId;
  minStockThreshold: number;
  description?: string;
  image?: string;
  quantity: number; // Aggregate stock level (cached for performance)
  createdAt: Date;
  stock: number;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  barcode: { type: String, required: true, unique: true },
  price: { type: Number, required: true, min: 0 },
  categoryId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  minStockThreshold: { type: Number, default: 5 },
  description: String,
  image: String,
  quantity: { type: Number, default: 0 }, // ← Cached total stock
  createdAt: { type: Date, default: Date.now }
});

export const Product = model<IProduct>('Product', productSchema);