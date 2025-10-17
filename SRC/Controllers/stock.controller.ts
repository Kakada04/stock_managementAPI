// src/controllers/stock.controller.ts
import { Request, Response } from 'express';
import { StockService } from '../Services/stock.service';

// ... your existing functions (restockProduct, adjustStock, etc.)

export const restockProduct = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, reason } = req.body;
    const userId = (req as any).user.id;

    const result = await StockService.restockProduct(
      productId,
      quantity,
      userId,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Product restocked successfully',
      product: result.product,
      log: result.log
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, reason } = req.body;
    const userId = (req as any).user.id;

    const result = await StockService.reduceStockManually(
      productId,
      quantity,
      userId,
      reason
    );

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      product: result.product,
      log: result.log
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getStockHistory = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const history = await StockService.getStockHistory(
      req.params.productId,
      Number(page),
      Number(limit)
    );
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStockReport = async (req: Request, res: Response) => {
  try {
    const products = await StockService.getStockReport();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 NEW: Export to Excel
export const exportStockToExcel = async (req: Request, res: Response) => {
  try {
    const products = await StockService.getStockReport();
    
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Report');

    // Add headers
    worksheet.columns = [
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Barcode', key: 'barcode', width: 20 },
      { header: 'Current Stock', key: 'quantity', width: 15 },
      { header: 'Min Threshold', key: 'minStockThreshold', width: 15 },
      { header: 'Price ($)', key: 'price', width: 15 }
    ];

    // Add data
    products.forEach((product: any) => {
      worksheet.addRow({
        name: product.name,
        category: product.categoryId?.name || 'N/A',
        barcode: product.barcode,
        quantity: product.quantity,
        minStockThreshold: product.minStockThreshold,
        price: product.price
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=stock-report.xlsx'
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Failed to generate Excel report' });
  }
};

// 🔥 NEW: Export to PDF
export const exportStockToPdf = async (req: Request, res: Response) => {
  try {
    const products = await StockService.getStockReport();
    
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=stock-report.pdf');

    // Pipe PDF to response
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Stock Management Report', { align: 'center' });
    doc.moveDown();

    // Table headers
    const headers = ['Product', 'Category', 'Barcode', 'Stock', 'Min', 'Price ($)'];
    let y = 150;
    doc.fontSize(12).font('Helvetica-Bold');
    
    headers.forEach((header, i) => {
      doc.text(header, 50 + i * 100, y);
    });
    
    // Table rows
    doc.font('Helvetica');
    products.forEach((product: any, index) => {
      y += 25;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      
      doc.text(product.name, 50, y);
      doc.text(product.categoryId?.name || 'N/A', 150, y);
      doc.text(product.barcode, 250, y);
      doc.text(product.quantity.toString(), 350, y);
      doc.text(product.minStockThreshold.toString(), 450, y);
      doc.text(`$${product.price.toFixed(2)}`, 550, y);
    });

    doc.end();
  } catch (error: any) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Failed to generate PDF report' });
  }
};