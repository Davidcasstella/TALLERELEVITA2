const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin, requireMenuManagement } = require('../middleware/roleMiddleware');
const { validateProduct, validateObjectId, validateSearchQuery } = require('../middleware/validationMiddleware');

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
 *     summary: Obtener lista de productos con filtros
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por ID de categoría
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidad
 *         example: true
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o descripción
 *         example: "pizza"
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *         example: 10000
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Precio máximo
 *         example: 50000
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Productos por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt, rating, popularity]
 *           default: createdAt
 *         description: Campo por el cual ordenar
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden ascendente o descendente
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       401:
 *         description: Token no válido o ausente
 *       500:
 *         description: Error interno del servidor
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
 *                 description: Nombre del producto
 *                 example: "Pizza Margherita"
 *               description:
 *                 type: string
 *                 description: Descripción del producto
 *                 example: "Pizza clásica con tomate, mozzarella y albahaca"
 *               price:
 *                 type: number
 *                 description: Precio del producto en pesos colombianos
 *                 example: 25000
 *               category:
 *                 type: string
 *                 description: ID de la categoría del producto
 *                 example: "68ccafc40f3db8123b8da581"
 *               ingredients:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                   - type: string
 *                 description: Ingredientes (array o string separado por comas)
 *                 example: "masa,salsa de tomate,mozzarella,albahaca"
 *               preparationTime:
 *                 type: number
 *                 description: Tiempo de preparación en minutos
 *                 example: 15
 *               isVegetarian:
 *                 type: boolean
 *                 description: ¿Es vegetariano?
 *                 example: true
 *               isVegan:
 *                 type: boolean
 *                 description: ¿Es vegano?
 *                 example: false
 *               isGlutenFree:
 *                 type: boolean
 *                 description: ¿Es libre de gluten?
 *                 example: false
 *               spicyLevel:
 *                 type: number
 *                 description: Nivel de picante (0-5)
 *                 example: 0
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos inválidos o categoría no válida
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo admin y chef pueden crear productos)
 *       500:
 *         description: Error interno del servidor
 */

// Obtener productos (todos los usuarios autenticados pueden ver)
router.get('/', 
  authenticateToken, 
  validateSearchQuery,
  productController.getProducts
);

// Crear producto (solo admin y chef)
router.post('/', 
  authenticateToken, 
  requireMenuManagement('create'),
  validateProduct,
  productController.createProduct
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
 *         description: ID del producto (MongoDB ObjectId)
 *         example: "68cdef91bb1d8013207e7a87"
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
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 *       400:
 *         description: ID de producto inválido
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
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
 *         example: "68cdef73bb1d8013207e7a82"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Pizza Margherita Especial"
 *               description:
 *                 type: string
 *                 example: "Pizza clásica mejorada con ingredientes premium"
 *               price:
 *                 type: number
 *                 example: 28000
 *               category:
 *                 type: string
 *                 example: "68cc9ef6bab5c9c2f28ad5ac"
 *               ingredients:
 *                 oneOf:
 *                   - type: array
 *                     items:
 *                       type: string
 *                   - type: string
 *                 example: "masa artesanal,salsa de tomate,mozzarella premium,albahaca fresca"
 *               preparationTime:
 *                 type: number
 *                 example: 18
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       400:
 *         description: Datos inválidos o no hay datos para actualizar
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo admin y chef)
 *       500:
 *         description: Error interno del servidor
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
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo admin puede eliminar productos)
 *       500:
 *         description: Error interno del servidor
 */

// Obtener producto por ID (todos los usuarios autenticados)
router.get('/:id', 
  authenticateToken, 
  validateObjectId('id'),
  productController.getProductById
);

// Actualizar producto (solo admin y chef)
router.put('/:id', 
  authenticateToken, 
  requireMenuManagement('update'),
  validateObjectId('id'),
  productController.updateProduct
);

// Eliminar producto (solo admin)
router.delete('/:id', 
  authenticateToken, 
  requireAdmin,
  validateObjectId('id'),
  productController.deleteProduct
);

module.exports = router;