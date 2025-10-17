import { Router } from "express";
import { getTotalProduct } from '../Controllers/analytic.controller'; // adjust path

const router = Router();

// Route to get total products
router.get("/overview", getTotalProduct);

export default router;
