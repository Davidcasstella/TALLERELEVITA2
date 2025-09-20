const express = require('express');
const router = express.Router();
const { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');

// Importar middlewares
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin, requireMenuManagement } = require('../middleware/roleMiddleware');
const { validateCategory, validateObjectId } = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Categorías
 *   description: Gestión de categorías de productos del restaurante
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Category'
 *             example:
 *               success: true
 *               data:
 *                 - _id: "68ccafae0f3db8123b8da57d"
 *                   name: "Platos Principales"
 *                   description: "Platos principales del menú"
 *                   icon: "🍽️"
 *                   sortOrder: 1
 *                   isActive: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 *   post:
 *     summary: Crear nueva categoría
 *     tags: [Categorías]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre de la categoría
 *                 maxLength: 50
 *                 example: "Postres"
 *               description:
 *                 type: string
 *                 description: Descripción de la categoría
 *                 maxLength: 200
 *                 example: "Deliciosos postres caseros"
 *               icon:
 *                 type: string
 *                 description: Emoji o icono representativo
 *                 maxLength: 10
 *                 example: "🍰"
 *               sortOrder:
 *                 type: number
 *                 description: Orden de clasificación
 *                 minimum: 0
 *                 example: 3
 *               isActive:
 *                 type: boolean
 *                 description: Estado activo/inactivo
 *                 example: true
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       400:
 *         description: Error de validación o categoría duplicada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo admin puede crear categorías)
 *       500:
 *         description: Error interno del servidor
 */

// Obtener todas las categorías (todos los usuarios autenticados)
router.get('/', authenticateToken, getCategories);

// Crear nueva categoría (solo admin)
router.post('/', 
  authenticateToken, 
  requireAdmin,
  validateCategory, 
  createCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría (MongoDB ObjectId)
 *         example: "68ccafae0f3db8123b8da57d"
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Categoría no encontrada
 *       401:
 *         description: No autorizado
 *       400:
 *         description: ID inválido
 *       500:
 *         description: Error interno del servidor
 *   put:
 *     summary: Actualizar categoría
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *         example: "68ccafae0f3db8123b8da57d"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Platos Principales Premium"
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Platos principales con ingredientes premium"
 *               icon:
 *                 type: string
 *                 maxLength: 10
 *                 example: "🍽️"
 *               sortOrder:
 *                 type: number
 *                 minimum: 0
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *       400:
 *         description: Error de validación o nombre duplicado
 *       404:
 *         description: Categoría no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo admin)
 *       500:
 *         description: Error interno del servidor
 *   delete:
 *     summary: Eliminar categoría
 *     tags: [Categorías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *         example: "68ccafae0f3db8123b8da57d"
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 *       400:
 *         description: No se puede eliminar (tiene productos asociados)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No se puede eliminar la categoría porque tiene 5 producto(s) asociado(s)"
 *       404:
 *         description: Categoría no encontrada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo admin)
 *       500:
 *         description: Error interno del servidor
 */

// Obtener categoría por ID (todos los usuarios autenticados)
router.get('/:id', 
  authenticateToken,
  validateObjectId('id'), 
  getCategoryById
);

// Actualizar categoría (solo admin)
router.put('/:id', 
  authenticateToken,
  requireAdmin,
  validateObjectId('id'), 
  validateCategory, 
  updateCategory
);

// Eliminar categoría (solo admin)
router.delete('/:id', 
  authenticateToken,
  requireAdmin,
  validateObjectId('id'), 
  deleteCategory
);

module.exports = router;