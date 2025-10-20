import { Schema, model, Document, Types } from 'mongoose';

interface IOrderItem {
  productId: Types.ObjectId;
  productName: string;
  productCategory: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  userName: string;
  userEmail: string;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userEmail: String,
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
        productCategory: String,
        quantity: Number,
        price: Number,
      },
    ],
    totalAmount: Number,
    status: { type: String, default: 'completed' },
  },
  { timestamps: true } // ✅ Auto adds createdAt and updatedAt
);

export const Order = model<IOrder>('Order', orderSchema);
