const express = require('express');
const router = express.Router();
const {createOrder, listOrders, getOrderById} = require('../Controllers/order.controller');
const {protect,authorizeRoles} = require('../Middleware/auth');


router.post('/',protect, createOrder);
router.get('/',protect, authorizeRoles('admin'), listOrders);
router.get('/:id',protect, getOrderById);

module.exports = router;