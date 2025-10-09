// CRUD for categories (admin only)
import { Request, Response } from 'express';
import { Category } from '../Models/Category';

export const getCategories = async (_req: Request, res: Response) => {
  const categories = await Category.find();
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
};

export const deleteCategory = async (req: Request, res: Response) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
};