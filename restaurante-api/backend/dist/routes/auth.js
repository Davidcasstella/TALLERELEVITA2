"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array()
        });
        return;
    }
    next();
};
const validateRegister = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2 })
        .withMessage('El nombre debe tener al menos 2 caracteres'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Email inválido'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    (0, express_validator_1.body)('role')
        .isIn(['customer', 'waiter', 'chef', 'admin'])
        .withMessage('Rol inválido'),
    handleValidationErrors
];
const validateLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Email inválido'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Contraseña requerida'),
    handleValidationErrors
];
router.post('/register', validateRegister, authController_1.default.register);
router.post('/login', validateLogin, authController_1.default.login);
router.post('/logout', authController_1.default.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map