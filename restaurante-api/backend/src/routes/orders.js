const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireEmployee, requireOrderAccess, requireWaiterOrAdmin } = require('../middleware/roleMiddleware');
const { validateOrder, validateOrderStatus, validateObjectId, validateSearchQuery } = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Pedidos
 *   description: Gestión completa de pedidos del restaurante
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Obtener lista de pedidos
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, delivered, cancelled]
 *         description: Filtrar por estado
 *         example: "pending"
 *       - in: query
 *         name: tableNumber
 *         schema:
 *           type: integer
 *         description: Filtrar por mesa
 *         example: 8
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
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de pedidos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrderDetailed'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 7
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         pages:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Crear nuevo pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderCreate'
 *           example:
 *             items:
 *               - product: "68cdf8fbb5bd4faf93afa7b8"
 *                 quantity: 2
 *                 specialInstructions: "Sin albahaca"
 *               - product: "68cf0bdae64146370975880b"
 *                 quantity: 1
 *                 specialInstructions: "Muy picante"
 *             tableNumber: 8
 *             notes: "Para compartir"
 *             paymentMethod: "cash"
 *     responses:
 *       201:
 *         description: Pedido creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Pedido creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/OrderDetailed'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               producto_no_encontrado:
 *                 summary: Producto no encontrado
 *                 value:
 *                   success: false
 *                   message: "Producto con ID 68cdf8fbb5bd4faf93afa7b9 no encontrado"
 *               producto_no_disponible:
 *                 summary: Producto no disponible
 *                 value:
 *                   success: false
 *                   message: 'El producto "Pizza Margherita" no está disponible actualmente'
 *
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtener pedido específico
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pedido
 *         example: '68cf24e42f91a6d70dafec38'
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/OrderDetailed'
 *       404:
 *         description: Pedido no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Pedido no encontrado"
 *   put:
 *     summary: Actualizar pedido completo
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: '68cf24e42f91a6d70dafec38'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     specialInstructions:
 *                       type: string
 *               tableNumber:
 *                 type: integer
 *               notes:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, transfer]
 *           example:
 *             items:
 *               - product: "68cdf8fbb5bd4faf93afa7b8"
 *                 quantity: 3
 *                 specialInstructions: "Extra queso"
 *             tableNumber: 10
 *             notes: "Cambio en la orden"
 *             paymentMethod: "card"
 *     responses:
 *       200:
 *         description: Pedido actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Pedido actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/OrderDetailed'
 *       400:
 *         description: Solo se pueden modificar pedidos en estado pendiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: "Solo se pueden modificar pedidos en estado pendiente"
 *       404:
 *         description: Pedido no encontrado
 *   delete:
 *     summary: Eliminar pedido completamente del sistema
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: '68cf24e42f91a6d70dafec38'
 *     responses:
 *       200:
 *         description: Pedido eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Pedido eliminado completamente del sistema"
 *                 deletedOrder:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "68cf24e42f91a6d70dafec38"
 *                     orderNumber:
 *                       type: string
 *                       example: "ORD-20250920-003"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *       400:
 *         description: No se puede eliminar el pedido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               pedido_en_preparacion:
 *                 summary: Pedido en preparación
 *                 value:
 *                   success: false
 *                   message: "No se puede eliminar un pedido que está siendo preparado, listo o entregado. Solo pedidos pendientes o cancelados."
 *       404:
 *         description: Pedido no encontrado
 */

// Obtener pedidos (clientes ven solo los suyos, empleados ven todos)
router.get('/', 
  authenticateToken,
  validateSearchQuery,
  orderController.getOrders
);

// Obtener pedido por ID (con verificación de permisos)
router.get('/:id', 
  authenticateToken, 
  validateObjectId('id'),
  requireOrderAccess,
  orderController.getOrderById
);

// Crear pedido (cualquier usuario autenticado)
router.post('/', 
  authenticateToken, 
  validateOrder,
  orderController.createOrder
);

// Actualizar pedido (empleados pueden actualizar cualquiera, clientes solo los suyos)
router.put('/:id', 
  authenticateToken, 
  validateObjectId('id'),
  requireOrderAccess,
  orderController.updateOrder
);

// Eliminar pedido completamente del sistema
router.delete('/:id', 
  authenticateToken, 
  validateObjectId('id'),
  requireOrderAccess,
  orderController.deleteOrder
);

module.exports = router;