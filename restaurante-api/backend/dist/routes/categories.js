"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = __importDefault(require("../controllers/categoryController"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authenticateToken, categoryController_1.default.getAllCategories);
router.post('/', authMiddleware_1.authenticateToken, roleMiddleware_1.requireAdmin, validationMiddleware_1.validateCategory, categoryController_1.default.createCategory);
router.get('/:id', authMiddleware_1.authenticateToken, (0, validationMiddleware_1.validateObjectId)('id'), categoryController_1.default.getCategoryById);
router.put('/:id', authMiddleware_1.authenticateToken, roleMiddleware_1.requireAdmin, (0, validationMiddleware_1.validateObjectId)('id'), validationMiddleware_1.validateCategory, categoryController_1.default.updateCategory);
router.delete('/:id', authMiddleware_1.authenticateToken, roleMiddleware_1.requireAdmin, (0, validationMiddleware_1.validateObjectId)('id'), categoryController_1.default.deleteCategory);
exports.default = router;
//# sourceMappingURL=categories.js.map