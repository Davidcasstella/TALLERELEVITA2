import { Router } from 'express';
import CategoryController from '../controllers/categoryController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';
import { validateCategory, validateObjectId } from '../middleware/validationMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categorías
 *   description: Gestión de categorías de productos del restaurante
 */

/**
 * Rutas de categorías
 */

// Obtener todas las categorías (todos los usuarios autenticados)
router.get('/', authenticateToken, CategoryController.getAllCategories);

// Crear nueva categoría (solo admin)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validateCategory,
  CategoryController.createCategory
);

// Obtener categoría por ID (todos los usuarios autenticados)
router.get(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  CategoryController.getCategoryById
);

// Actualizar categoría (solo admin)
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId('id'),
  validateCategory,
  CategoryController.updateCategory
);

// Eliminar categoría (solo admin)
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId('id'),
  CategoryController.deleteCategory
);

export default router;