// src/routes/product.routes.ts
import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../Controllers/product.controller';
import { protect, authorizeRoles } from '../Middleware/auth';
import { upload } from '../Middleware/upload';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin-only routes
router.route('/')
  .post(protect, authorizeRoles('admin'), upload.single('image'), createProduct);

router.route('/:id')
  .put(protect, authorizeRoles('admin'), upload.single('image'), updateProduct)
  .delete(protect, authorizeRoles('admin'), deleteProduct);

export default router;