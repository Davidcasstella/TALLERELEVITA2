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
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por ID de categoría
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidad
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: No autorizado
 */
router.get(
  '/',
  authenticateToken,
  validateSearchQuery,
  ProductController.getAllProducts
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear nuevo producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *               - preparationTime
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Pizza Margherita"
 *               description:
 *                 type: string
 *                 example: "Pizza clásica italiana"
 *               price:
 *                 type: number
 *                 example: 35000
 *               category:
 *                 type: string
 *                 example: "60d5f7e1e4b0c8f8b8f8b8f8"
 *               image:
 *                 type: string
 *                 example: "https://example.com/pizza.jpg"
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Tomate", "Mozzarella", "Albahaca"]
 *               preparationTime:
 *                 type: number
 *                 example: 15
 *               isVegetarian:
 *                 type: boolean
 *                 example: true
 *               isVegan:
 *                 type: boolean
 *                 example: false
 *               isGlutenFree:
 *                 type: boolean
 *                 example: false
 *               spicyLevel:
 *                 type: number
 *                 example: 0
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Requiere permisos de administrador o chef
 */
router.post(
  '/',
  authenticateToken,
  requireMenuManagement('create'),
  validateProduct,
  ProductController.createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 */
router.get(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  ProductController.getProductById
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               preparationTime:
 *                 type: number
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Requiere permisos de administrador o chef
 */
router.put(
  '/:id',
  authenticateToken,
  requireMenuManagement('update'),
  validateObjectId('id'),
  ProductController.updateProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Requiere rol de administrador
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateObjectId('id'),
  ProductController.deleteProduct
);

export default router;