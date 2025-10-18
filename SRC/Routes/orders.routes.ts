const express = require('express');
const router = express.Router();
const {createOrder, listOrders, getOrderById,getSalesByPeriod} = require('../Controllers/order.controller');
const {protect,authorizeRoles} = require('../Middleware/auth');


router.post('/',protect, createOrder);
router.get('/',protect, authorizeRoles('admin'), listOrders);
router.get('/:id',protect, getOrderById);
router.get('/analytics/sales', protect, authorizeRoles('admin'), getSalesByPeriod);

module.exports = router;