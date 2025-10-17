// src/routes/stock.routes.ts
import { Router } from 'express';
import {
  restockProduct,
  adjustStock,
  getStockHistory,
  getStockReport,
  exportStockToExcel,   // 👈 Add these
  exportStockToPdf      // 👈
} from '../Controllers/stock.controller';
import { protect, authorizeRoles } from '../Middleware/auth';

const router = Router();

router.post('/restock', protect, authorizeRoles('admin'), restockProduct);
router.post('/adjust', protect, authorizeRoles('admin'), adjustStock);
router.get('/history/:productId', protect, authorizeRoles('admin'), getStockHistory);
router.get('/report', protect, authorizeRoles('admin'), getStockReport);
router.get('/export/excel', exportStockToExcel); // 👈
router.get('/export/pdf',  exportStockToPdf);     // 👈

export default router;