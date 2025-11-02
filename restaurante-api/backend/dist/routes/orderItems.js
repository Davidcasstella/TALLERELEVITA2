"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderItemController_1 = __importDefault(require("../controllers/orderItemController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authenticateToken, roleMiddleware_1.requireEmployee, orderItemController_1.default.getAllOrderItems);
router.get('/:id', authMiddleware_1.authenticateToken, roleMiddleware_1.requireEmployee, (0, validationMiddleware_1.validateObjectId)('id'), orderItemController_1.default.getOrderItemById);
router.put('/:id/status', authMiddleware_1.authenticateToken, roleMiddleware_1.requireEmployee, (0, validationMiddleware_1.validateObjectId)('id'), orderItemController_1.default.updatePreparationStatus);
router.get('/kitchen/pending', authMiddleware_1.authenticateToken, roleMiddleware_1.requireKitchenStaff, orderItemController_1.default.getPendingForKitchen);
exports.default = router;
//# sourceMappingURL=orderItems.js.map