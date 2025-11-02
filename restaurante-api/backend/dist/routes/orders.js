"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = __importDefault(require("../controllers/orderController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authenticateToken, validationMiddleware_1.validateSearchQuery, orderController_1.default.getAllOrders);
router.get('/:id', authMiddleware_1.authenticateToken, (0, validationMiddleware_1.validateObjectId)('id'), roleMiddleware_1.requireOrderAccess, orderController_1.default.getOrderById);
router.post('/', authMiddleware_1.authenticateToken, validationMiddleware_1.validateOrder, orderController_1.default.createOrder);
router.put('/:id/status', authMiddleware_1.authenticateToken, (0, validationMiddleware_1.validateObjectId)('id'), roleMiddleware_1.requireOrderAccess, orderController_1.default.updateOrderStatus);
router.delete('/:id', authMiddleware_1.authenticateToken, (0, validationMiddleware_1.validateObjectId)('id'), roleMiddleware_1.requireOrderAccess, orderController_1.default.cancelOrder);
exports.default = router;
//# sourceMappingURL=orders.js.map