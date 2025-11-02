"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateResourceExists = exports.validateSearchQuery = exports.validateObjectId = exports.validateOrderStatus = exports.validateOrder = exports.validateProduct = exports.validateCategory = exports.validateUserUpdate = exports.validateUserLogin = exports.validateUserRegistration = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array().map(error => ({
                field: error.type === 'field' ? error.path : 'unknown',
                message: error.msg,
                value: error.type === 'field' ? error.value : undefined
            }))
        });
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.validateUserRegistration = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('El email no puede exceder 100 caracteres'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La contraseña debe contener al menos: 1 minúscula, 1 mayúscula y 1 número'),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Formato de teléfono inválido'),
    (0, express_validator_1.body)('address')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La dirección no puede exceder 200 caracteres'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(['customer', 'waiter', 'chef', 'admin'])
        .withMessage('Rol inválido')
];
exports.validateUserLogin = [
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('La contraseña es obligatoria')
];
exports.validateUserUpdate = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Formato de teléfono inválido'),
    (0, express_validator_1.body)('address')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La dirección no puede exceder 200 caracteres')
];
exports.validateCategory = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('La descripción no puede exceder 200 caracteres'),
    (0, express_validator_1.body)('icon')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('El icono no puede exceder 10 caracteres'),
    (0, express_validator_1.body)('sortOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El orden debe ser un número entero no negativo')
];
exports.validateProduct = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    (0, express_validator_1.body)('price')
        .isNumeric()
        .withMessage('El precio debe ser un número')
        .custom((value) => {
        if (value < 0) {
            throw new Error('El precio no puede ser negativo');
        }
        if (value > 999999) {
            throw new Error('El precio es demasiado alto');
        }
        return true;
    }),
    (0, express_validator_1.body)('category')
        .notEmpty()
        .withMessage('La categoría es obligatoria')
        .custom((value) => {
        if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
            throw new Error('ID de categoría inválido');
        }
        return true;
    }),
    (0, express_validator_1.body)('ingredients')
        .optional()
        .custom((value) => {
        if (Array.isArray(value)) {
            value.forEach((ingredient) => {
                if (typeof ingredient !== 'string' || ingredient.trim().length === 0) {
                    throw new Error('Cada ingrediente debe ser texto válido');
                }
                if (ingredient.length > 50) {
                    throw new Error('Un ingrediente no puede exceder 50 caracteres');
                }
            });
        }
        else if (typeof value === 'string') {
            if (value.length > 500) {
                throw new Error('La lista de ingredientes es demasiado larga');
            }
        }
        else {
            throw new Error('Los ingredientes deben ser un array o string separado por comas');
        }
        return true;
    }),
    (0, express_validator_1.body)('preparationTime')
        .isInt({ min: 1, max: 180 })
        .withMessage('El tiempo de preparación debe estar entre 1 y 180 minutos'),
    (0, express_validator_1.body)('isVegetarian')
        .optional()
        .custom((value) => {
        if (typeof value === 'string') {
            return value === 'true' || value === 'false';
        }
        return typeof value === 'boolean';
    })
        .withMessage('isVegetarian debe ser verdadero o falso'),
    (0, express_validator_1.body)('isVegan')
        .optional()
        .custom((value) => {
        if (typeof value === 'string') {
            return value === 'true' || value === 'false';
        }
        return typeof value === 'boolean';
    })
        .withMessage('isVegan debe ser verdadero o falso'),
    (0, express_validator_1.body)('isGlutenFree')
        .optional()
        .custom((value) => {
        if (typeof value === 'string') {
            return value === 'true' || value === 'false';
        }
        return typeof value === 'boolean';
    })
        .withMessage('isGlutenFree debe ser verdadero o falso'),
    (0, express_validator_1.body)('spicyLevel')
        .optional()
        .custom((value) => {
        const num = Number(value);
        return !isNaN(num) && num >= 0 && num <= 5;
    })
        .withMessage('El nivel picante debe estar entre 0 y 5')
];
exports.validateOrder = [
    (0, express_validator_1.body)('items')
        .isArray({ min: 1 })
        .withMessage('Debe incluir al menos un item en el pedido'),
    (0, express_validator_1.body)('items.*.product')
        .custom((value) => {
        if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
            throw new Error('ID de producto inválido');
        }
        return true;
    }),
    (0, express_validator_1.body)('items.*.quantity')
        .isInt({ min: 1, max: 50 })
        .withMessage('La cantidad debe estar entre 1 y 50'),
    (0, express_validator_1.body)('items.*.specialInstructions')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Las instrucciones especiales no pueden exceder 200 caracteres'),
    (0, express_validator_1.body)('tableNumber')
        .isInt({ min: 1, max: 100 })
        .withMessage('El número de mesa debe estar entre 1 y 100'),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden exceder 500 caracteres'),
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .isIn(['cash', 'card', 'transfer'])
        .withMessage('Método de pago inválido')
];
exports.validateOrderStatus = [
    (0, express_validator_1.body)('status')
        .isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
        .withMessage('Estado de pedido inválido')
];
const validateObjectId = (paramName = 'id') => [
    (0, express_validator_1.param)(paramName)
        .custom((value) => {
        if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
            throw new Error(`${paramName} inválido`);
        }
        return true;
    })
];
exports.validateObjectId = validateObjectId;
exports.validateSearchQuery = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero mayor a 0'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe estar entre 1 y 100'),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isIn(['name', 'price', 'createdAt', 'rating', 'popularity'])
        .withMessage('Campo de ordenamiento inválido'),
    (0, express_validator_1.query)('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Orden debe ser asc o desc'),
    (0, express_validator_1.query)('minPrice')
        .optional()
        .isNumeric()
        .withMessage('Precio mínimo debe ser un número'),
    (0, express_validator_1.query)('maxPrice')
        .optional()
        .isNumeric()
        .withMessage('Precio máximo debe ser un número')
];
const validateResourceExists = (ModelClass, field = '_id', paramName = 'id') => {
    return async (req, res, next) => {
        try {
            const value = req.params[paramName] || req.body[paramName];
            if (!value) {
                res.status(400).json({
                    success: false,
                    message: `${paramName} es requerido`
                });
                return;
            }
            const query = {};
            query[field] = value;
            const resource = await ModelClass.findOne(query);
            if (!resource) {
                res.status(404).json({
                    success: false,
                    message: `${ModelClass.modelName} no encontrado`
                });
                return;
            }
            req.resource = resource;
            next();
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al validar existencia del recurso'
            });
        }
    };
};
exports.validateResourceExists = validateResourceExists;
//# sourceMappingURL=validationMiddleware.js.map