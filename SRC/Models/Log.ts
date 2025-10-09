import { Schema, model, Document, Types } from 'mongoose';

export interface ILog extends Document {
  userId: Types.ObjectId;
  action: string;
  productId?: Types.ObjectId;
  timestamp: Date;
}

const logSchema = new Schema<ILog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
  timestamp: { type: Date, default: Date.now }
});

export const Log = model<ILog>('Log', logSchema);