import { Router } from 'express';
import ProductController from '../controllers/productController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin, requireMenuManagement } from '../middleware/roleMiddleware';
import {
  validateProduct,
  validateObjectId,
  validateSearchQuery
} from '../middleware/validationMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: Gestión del menú de productos del restaurante
 */

/**
 * Rutas de productos
 */

// Obtener productos (todos los usuarios autenticados pueden ver)
router.get(
  '/',
  authenticateToken,
  validateSearchQuery,
  ProductController.getAllProducts
);

// Crear producto (solo admin y chef)
router.post(
  '/',
  authenticateToken,
  requireMenuManagement('create'),
  validateProduct,
  ProductController.createProduct
);

// Obtener producto por ID (todos los usuarios autenticados)
router.get(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  ProductController.getProductById
);

// Actualizar producto (solo admin y chef)
router.put(
  '/:id',
  authenticateToken,
  requireMenuManagement('update'),
  validateObjectId('id'),
  ProductController.updateProduct
);

// Eliminar producto (solo admin)
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId('id'),
  ProductController.deleteProduct
);

export default router;