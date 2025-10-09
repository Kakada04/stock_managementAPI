// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { User } from '../Models/User';

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Admin
export const getUsers = async (req: Request, res: Response) => {
  try {
    // Fetch only users where role is NOT 'admin'
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
    
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create user (Admin only — e.g., create another admin)
// @route   POST /api/users
// @access  Admin
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await User.create({ name, email, password, role });
    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Admin
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};