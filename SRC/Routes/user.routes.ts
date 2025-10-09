import { Router } from 'express';
import { getUsers, createUser, deleteUser } from '../Controllers/user.controller';
import { protect, authorizeRoles } from '../Middleware/auth';

const router = Router();

// Admin-only routes
router.route('/')
  .get(protect, authorizeRoles('admin'), getUsers)
  .post(protect, authorizeRoles('admin'), createUser);

router.route('/:id')
  .delete(protect, authorizeRoles('admin'), deleteUser);

export default router;