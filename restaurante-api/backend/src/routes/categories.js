const express = require('express');
const router = express.Router();
const { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');

// Importar validaciones
const { validateCategory, validateObjectId } = require('../middleware/validationMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único de la categoría
 *         name:
 *           type: string
 *           description: Nombre de la categoría
 *           maxLength: 50
 *         description:
 *           type: string
 *           description: Descripción de la categoría
 *           maxLength: 200
 *         icon:
 *           type: string
 *           description: Icono representativo
 *           maxLength: 10
 *         sortOrder:
 *           type: number
 *           description: Orden de clasificación
 *           minimum: 0
 *         isActive:
 *           type: boolean
 *           description: Estado activo/inactivo
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Categories]
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/', getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *       404:
 *         description: Categoría no encontrada
 */
router.get('/:id', validateObjectId(), getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crear nueva categoría
 *     tags: [Categories]
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
 *                 maxLength: 50
 *               description:
 *                 type: string
 *                 maxLength: 200
 *               icon:
 *                 type: string
 *                 maxLength: 10
 *               sortOrder:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *       400:
 *         description: Error de validación
 */
router.post('/', validateCategory, createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *               description:
 *                 type: string
 *                 maxLength: 200
 *               icon:
 *                 type: string
 *                 maxLength: 10
 *               sortOrder:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *       404:
 *         description: Categoría no encontrada
 */
router.put('/:id', validateObjectId(), validateCategory, updateCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Eliminar categoría
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 *       400:
 *         description: No se puede eliminar (tiene productos asociados)
 *       404:
 *         description: Categoría no encontrada
 */
router.delete('/:id', validateObjectId(), deleteCategory);

module.exports = router;