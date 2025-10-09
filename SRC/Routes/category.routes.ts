import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../Controllers/category.controller';
import { protect, authorizeRoles } from '../Middleware/auth';

const router = Router();

router.route('/')
  .get(getCategories)
  .post(protect, authorizeRoles('admin'), createCategory);

router.route('/:id')
  .put(protect, authorizeRoles('admin'), updateCategory)
  .delete(protect, authorizeRoles('admin'), deleteCategory);

export default router;