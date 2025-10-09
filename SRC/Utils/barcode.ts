// src/utils/barcode.ts
import { v4 as uuidv4 } from 'uuid';

// Generate a simple unique barcode (e.g., PROD-abc123)
export const generateBarcode = (): string => {
  return `PROD-${uuidv4().substring(0, 8).toUpperCase()}`;
};