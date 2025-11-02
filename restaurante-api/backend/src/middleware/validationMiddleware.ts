import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import mongoose, { Model, Document } from 'mongoose';
import { AuthRequest } from '../controllers/authController';

/**
 * Middleware para manejar errores de validación
 * Se debe usar después de las validaciones
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }))
    });
    return;
  }

  next();
};

/**
 * Validaciones para usuarios
 */
export const validateUserRegistration: ValidationChain[] = [
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
    .withMessage('Rol inválido')
];

export const validateUserLogin: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
];

export const validateUserUpdate: ValidationChain[] = [
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
    .withMessage('La dirección no puede exceder 200 caracteres')
];

/**
 * Validaciones para categorías
 */
export const validateCategory: ValidationChain[] = [
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
    .withMessage('El orden debe ser un número entero no negativo')
];

/**
 * Validaciones para productos
 */
export const validateProduct: ValidationChain[] = [
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
    .custom((value: number) => {
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
    .custom((value: string) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('ID de categoría inválido');
      }
      return true;
    }),

  // Validación flexible para ingredients (array o string)
  body('ingredients')
    .optional()
    .custom((value: any) => {
      if (Array.isArray(value)) {
        // Si es array, validar cada elemento
        value.forEach((ingredient: any) => {
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
    .custom((value: any) => {
      if (typeof value === 'string') {
        return value === 'true' || value === 'false';
      }
      return typeof value === 'boolean';
    })
    .withMessage('isVegetarian debe ser verdadero o falso'),

  body('isVegan')
    .optional()
    .custom((value: any) => {
      if (typeof value === 'string') {
        return value === 'true' || value === 'false';
      }
      return typeof value === 'boolean';
    })
    .withMessage('isVegan debe ser verdadero o falso'),

  body('isGlutenFree')
    .optional()
    .custom((value: any) => {
      if (typeof value === 'string') {
        return value === 'true' || value === 'false';
      }
      return typeof value === 'boolean';
    })
    .withMessage('isGlutenFree debe ser verdadero o falso'),

  body('spicyLevel')
    .optional()
    .custom((value: any) => {
      const num = Number(value);
      return !isNaN(num) && num >= 0 && num <= 5;
    })
    .withMessage('El nivel picante debe estar entre 0 y 5')
];

/**
 * Validaciones para pedidos
 */
export const validateOrder: ValidationChain[] = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un item en el pedido'),

  body('items.*.product')
    .custom((value: string) => {
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
    .withMessage('Método de pago inválido')
];

export const validateOrderStatus: ValidationChain[] = [
  body('status')
    .isIn(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
    .withMessage('Estado de pedido inválido')
];

/**
 * Validaciones para parámetros de URL
 */
export const validateObjectId = (paramName: string = 'id'): ValidationChain[] => [
  param(paramName)
    .custom((value: string) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`${paramName} inválido`);
      }
      return true;
    })
];

/**
 * Validaciones para queries de búsqueda
 */
export const validateSearchQuery: ValidationChain[] = [
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
    .withMessage('Precio máximo debe ser un número')
];

/**
 * Validación personalizada para verificar que existe un recurso
 */
export const validateResourceExists = <T extends Document>(
  ModelClass: Model<T>,
  field: string = '_id',
  paramName: string = 'id'
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const value = req.params[paramName] || req.body[paramName];

      if (!value) {
        res.status(400).json({
          success: false,
          message: `${paramName} es requerido`
        });
        return;
      }

      const query: any = {};
      query[field] = value;

      const resource = await ModelClass.findOne(query);

      if (!resource) {
        res.status(404).json({
          success: false,
          message: `${ModelClass.modelName} no encontrado`
        });
        return;
      }

      // Adjunta el recurso encontrado al request para uso posterior
      (req as any).resource = resource;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al validar existencia del recurso'
      });
    }
  };
};