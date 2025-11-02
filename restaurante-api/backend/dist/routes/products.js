"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = __importDefault(require("../controllers/productController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authenticateToken, validationMiddleware_1.validateSearchQuery, productController_1.default.getAllProducts);
router.post('/', authMiddleware_1.authenticateToken, (0, roleMiddleware_1.requireMenuManagement)('create'), validationMiddleware_1.validateProduct, productController_1.default.createProduct);
router.get('/:id', authMiddleware_1.authenticateToken, (0, validationMiddleware_1.validateObjectId)('id'), productController_1.default.getProductById);
router.put('/:id', authMiddleware_1.authenticateToken, (0, roleMiddleware_1.requireMenuManagement)('update'), (0, validationMiddleware_1.validateObjectId)('id'), productController_1.default.updateProduct);
router.delete('/:id', authMiddleware_1.authenticateToken, roleMiddleware_1.requireAdmin, (0, validationMiddleware_1.validateObjectId)('id'), productController_1.default.deleteProduct);
exports.default = router;
//# sourceMappingURL=products.js.map