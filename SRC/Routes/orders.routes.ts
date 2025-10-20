import { getTopSellingProducts } from '../Controllers/order.controller';

const express = require('express');
const router = express.Router();
const {createOrder, listOrders, getOrderById,getSalesByPeriod} = require('../Controllers/order.controller');
const {protect,authorizeRoles} = require('../Middleware/auth');



router.post('/',protect, createOrder);
router.get('/',protect, authorizeRoles('admin'), listOrders);
router.get('/:id',protect, getOrderById);
router.get('/analytics/sales', protect, authorizeRoles('admin'), getSalesByPeriod);

router.get('/analytics/top-selling', protect, authorizeRoles('admin'), getTopSellingProducts);

module.exports = router;