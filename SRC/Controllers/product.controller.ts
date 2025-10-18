// src/controllers/product.controller.ts
import { Request, Response } from 'express';
import { Product, IProduct } from '../Models/Product';
import { Category } from '../Models/Category';
import { generateBarcode } from '../Utils/barcode';
import { NotificationService } from '../Services/NotificationService';
import fs from 'fs';
import path from 'path';


// ✅ Helper: Add full image URL to product(s)
const addFullImageUrl = (product: any, req: Request) => {
  if (product.image) {
    // Convert relative path to full URL: /uploads/... → http://localhost:5000/uploads/...
    product.image = `${req.protocol}://${req.get('host')}${product.image}`;
  }
  return product;
};

const isValidBarcode = (barcode: string): boolean => {
  return typeof barcode === 'string' && /^[a-zA-Z0-9]{6,50}$/.test(barcode);
};

// @desc    Get all products with search, filter, pagination
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;

    let query: any = {};

    if (search) {
      query.name = { $regex: search as string, $options: 'i' };
    }

    if (category) {
      const cat = await Category.findOne({ name: { $regex: category as string, $options: 'i' } });
      if (cat) {
        query.categoryId = cat._id;
      } else {
        return res.json({
          products: [],
          currentPage: 1,
          totalPages: 0,
          total: 0
        });
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .limit(Number(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    // ✅ Add full image URL to each product
    const productsWithUrl = products.map(product => 
      addFullImageUrl(product.toObject(), req)
    );

    res.json({
      products: productsWithUrl,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryId', 'name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // ✅ Add full image URL
    const productWithUrl = addFullImageUrl(product.toObject(), req);
    res.json(productWithUrl);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Admin
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      categoryId, 
      price, 
      quantity, 
      minStockThreshold, 
      description, 
      barcode: userBarcode 
    } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // ✅ STEP 1: Handle user-provided barcode
    if (userBarcode) {
      if (!isValidBarcode(userBarcode)) {
        return res.status(400).json({ 
          message: 'Invalid barcode format. Use 6-50 alphanumeric characters.' 
        });
      }

      const existing = await Product.findOne({ barcode: userBarcode });
      if (existing) {
        return res.status(400).json({ 
          message: 'Barcode already exists.' 
        });
      }

      // ✅ Use user barcode and proceed
      return await createProductWithBarcode(
        req, res, 
        name, categoryId, price, quantity, minStockThreshold, description, userBarcode
      );
    }

    // ✅ STEP 2: Auto-generate barcode
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      const barcode = generateBarcode();
      const exists = await Product.findOne({ barcode });
      if (!exists) {
        // ✅ Found unique barcode — proceed
        return await createProductWithBarcode(
          req, res, 
          name, categoryId, price, quantity, minStockThreshold, description, barcode
        );
      }
      attempts++;
    }

    // ❌ Failed to generate
    return res.status(500).json({ 
      message: 'Could not generate unique barcode after 10 attempts.' 
    });

  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Barcode already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// ✅ Helper: Create product once barcode is confirmed
const createProductWithBarcode = async (
  req: Request,
  res: Response,
  name: string,
  categoryId: string,
  price: number,
  quantity: number,
  minStockThreshold: number,
  description: string | undefined,
  barcode: string
) => {
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const image = req.file ? `/uploads/products/${req.file.filename}` : undefined;

  const product = await Product.create({
    name,
    categoryId,
    price,
    quantity: quantity || 0,
    minStockThreshold: minStockThreshold || 5,
    barcode,
    description,
    image
  });

  const productWithUrl = {
    ...product.toObject(),
    image: image ? `${req.protocol}://${req.get('host')}${image}` : undefined
  };

  NotificationService.emitProductCreated(productWithUrl);
  return res.status(201).json(productWithUrl);
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { name, categoryId, price, quantity, minStockThreshold, description } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    if (req.file) {
      req.body.image = `/uploads/products/${req.file.filename}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name');

    // ✅ Add full image URL
    const productWithUrl = addFullImageUrl(updatedProduct!.toObject(), req);

    NotificationService.emitProductUpdated(productWithUrl);

    res.json(productWithUrl);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();

    NotificationService.emitProductDeleted(product.id.toString());

    res.json({ message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};