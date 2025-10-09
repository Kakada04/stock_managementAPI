// import { Product } from '../Models/Product';
// import { NotificationService } from './NotificationService';
// import { Log } from '../Models/Log';

// export class ProductService {
//   static async updateStock(productId: string, change: number, updatedBy: string) {
//     const product = await Product.findById(productId);
//     if (!product) throw new Error('Product not found');

//     const newQty = product.quantity + change;

//     // Prevent negative stock
//     if (newQty < 0) {
//       throw new Error('Insufficient stock');
//     }

//     product.quantity = newQty;
//     await product.save();

//     // 📝 Log activity
//     await Log.create({ userId: updatedBy, action: 'updated stock', productId });

//     // 🔔 Emit real-time update
//     NotificationService.emitStockUpdated(productId, newQty, updatedBy);

//     // ⚠️ Check low stock
//     if (newQty <= (product.minStockThreshold || 5)) {
//       NotificationService.emitLowStock(product._id.toString(), product.name, newQty);
//     }

//     return product;
//   }
// }