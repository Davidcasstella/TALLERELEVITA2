const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Middleware para manejar errores de validación
 * Se debe usar después de las validaciones
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * Validaciones para usuarios
 */
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('El email no puede exceder 100 caracteres'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos: 1 minúscula, 1 mayúscula y 1 número'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Formato de teléfono inválido'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La dirección no puede exceder 200 caracteres'),

  body('role')
    .optional()
    .isIn(['customer', 'waiter', 'chef', 'admin'])
    .withMessage('Rol inválido'),

  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),

  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Formato de teléfono inválido'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La dirección no puede exceder 200 caracteres'),

  handleValidationErrors
];

/**
 * Validaciones para categorías
 */
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La descripción no puede exceder 200 caracteres'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('El icono no puede exceder 10 caracteres'),

  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero no negativo'),

  handleValidationErrors
];

// validación validateProduct en validationMiddleware.js con esto:

const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),

  body('price')
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

  body('category')
    .notEmpty()
    .withMessage('La categoría es obligatoria')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('ID de categoría inválido');
      }
      return true;
    }),

  // Validación flexible para ingredients (array o string)
  body('ingredients')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        // Si es array, validar cada elemento
        value.forEach(ingredient => {
          if (typeof ingredient !== 'string' || ingredient.trim().length === 0) {
            throw new Error('Cada ingrediente debe ser texto válido');
          }
          if (ingredient.length > 50) {
            throw new Error('Un ingrediente no puede exceder 50 caracteres');
          }
        });
      } else if (typeof value === 'string') {
        // Si es string, validar formato
        if (value.length > 500) {
          throw new Error('La lista de ingredientes es demasiado larga');
        }
      } else {
        throw new Error('Los ingredientes deben ser un array o string separado por comas');
      }
      return true;
    }),

  body('preparationTime')
    .isInt({ min: 1, max: 180 })
    .withMessage('El tiempo de preparación debe estar entre 1 y 180 minutos'),

  body('isVegetarian')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        return value === 'true' || value === 'false';
      }
      return typeof value === 'boolean';
    })
    .withMessage('isVegetarian debe ser verdadero o falso'),

  body('isVegan')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        return value === 'true' || value === 'false';
      }
      return typeof value === 'boolean';
    })
    .withMessage('isVegan debe ser verdadero o falso'),

  body('isGlutenFree')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        return value === 'true' || value === 'false';
      }
      return typeof value === 'boolean';
    })
    .withMessage('isGlutenFree debe ser verdadero o falso'),

  body('spicyLevel')
    .optional()
    .custom((value) => {
      const num = Number(value);
      return !isNaN(num) && num >= 0 && num <= 5;
    })
    .withMessage('El nivel picante debe estar entre 0 y 5'),

  handleValidationErrors
];

/**
 * Validaciones para pedidos
 */
const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un item en el pedido'),

  body('items.*.product')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('ID de producto inválido');
      }
      return true;
    }),

  body('items.*.quantity')
    .isInt({ min: 1, max: 50 })
    .withMessage('La cantidad debe estar entre 1 y 50'),

  body('items.*.specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Las instrucciones especiales no pueden exceder 200 caracteres'),

  body('tableNumber')
    .isInt({ min: 1, max: 100 })
    .withMessage('El número de mesa debe estar entre 1 y 100'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres'),

  body('paymentMethod')
    .optional()
    .isIn(['cash', 'card', 'transfer'])
    .withMessage('Método de pago inválido'),

  handleValidationErrors
];

const validateOrderStatus = [
  body('status')
    .isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
    .withMessage('Estado de pedido inválido'),

  handleValidationErrors
];

/**
 * Validaciones para parámetros de URL
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`${paramName} inválido`);
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validaciones para queries de búsqueda
 */
const validateSearchQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),

  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'createdAt', 'rating', 'popularity'])
    .withMessage('Campo de ordenamiento inválido'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc'),

  query('minPrice')
    .optional()
    .isNumeric()
    .withMessage('Precio mínimo debe ser un número'),

  query('maxPrice')
    .optional()
    .isNumeric()
    .withMessage('Precio máximo debe ser un número'),

  handleValidationErrors
];

/**
 * Validación personalizada para verificar que existe un recurso
 */
const validateResourceExists = (Model, field = '_id', paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const value = req.params[paramName] || req.body[paramName];
      
      if (!value) {
        return res.status(400).json({
          success: false,
          message: `${paramName} es requerido`
        });
      }

      const resource = await Model.findOne({ [field]: value });
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${Model.modelName} no encontrado`
        });
      }
      // Adjunta el recurso encontrado al request para uso posterior
      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al validar existencia del recurso'
      });
    }
  };
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateCategory,
  validateProduct,
  validateOrder,
  validateOrderStatus,
  validateObjectId,
  validateSearchQuery,
  validateResourceExists
};

