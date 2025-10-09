import { io } from '../app';

export class NotificationService {
  static emitLowStock(productId: string, productName: string, currentQty: number) {
    io.to('admin-room').emit('low-stock-alert', {
      type: 'low-stock',
      productId,
      productName,
      currentQty,
      timestamp: new Date()
    });
  }

  static emitNewOrder(orderId: string, totalAmount: number) {
    io.to('admin-room').emit('new-order', {
      type: 'new-order',
      orderId,
      totalAmount,
      timestamp: new Date()
    });
  }

  static emitStockUpdated(productId: string, newQty: number, updatedBy: string) {
    io.emit('stock-updated', { productId, newQty, updatedBy }); // broadcast to all
  }

  static emitProductCreated(product: any) {
    io.to('admin-room').emit('product-created', product);
  }

  static emitProductUpdated(product: any) {
    io.emit('product-updated', product);
  }

  static emitProductDeleted(productId: string) {
    io.emit('product-deleted', { id: productId });
  }
}