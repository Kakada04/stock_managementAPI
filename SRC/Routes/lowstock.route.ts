// lowstock.route.ts
import { Router } from "express";
import { getLowStock } from "../Controllers/lowstock.controller";

const router = Router();
router.get("/lowstock", getLowStock);
export default router;
