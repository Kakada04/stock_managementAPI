// src/models/StockLog.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IStockLog extends Document {
  productId: Types.ObjectId;
  productName: string;      // Denormalized for historical accuracy
  priceAtTime: number;      // Price at time of stock change
  action: 'restock' | 'sale' | 'adjustment';
  quantityChange: number;   // + for restock, - for reduction
  newTotalQuantity: number; // Total quantity after this change
  reason?: string;
  userId: Types.ObjectId;
  createdAt: Date;
}

const stockLogSchema = new Schema<IStockLog>({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  productName: { type: String, required: true },
  priceAtTime: { type: Number, required: true },
  action: { 
    type: String, 
    enum: ['restock', 'sale', 'adjustment'], 
    required: true 
  },
  quantityChange: { type: Number, required: true },
  newTotalQuantity: { type: Number, required: true },
  reason: String,
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

export const StockLog = model<IStockLog>('StockLog', stockLogSchema);