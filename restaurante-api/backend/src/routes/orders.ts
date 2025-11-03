import { Router } from 'express';
import OrderController from '../controllers/orderController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireOrderAccess } from '../middleware/roleMiddleware';
import {
  validateOrder,
  validateObjectId,
  validateSearchQuery
} from '../middleware/validationMiddleware';

const router = Router();

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
 *     summary: Obtener todos los pedidos
 *     description: Los clientes ven solo sus pedidos, los empleados ven todos
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
 *       - in: query
 *         name: customer
 *         schema:
 *           type: string
 *         description: Filtrar por ID de cliente
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderDetailed'
 *       401:
 *         description: No autorizado
 */
router.get(
  '/',
  authenticateToken,
  validateSearchQuery,
  OrderController.getAllOrders
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Obtener pedido por ID
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
 *                 data:
 *                   $ref: '#/components/schemas/OrderDetailed'
 *       404:
 *         description: Pedido no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos para ver este pedido
 */
router.get(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  requireOrderAccess,
  OrderController.getOrderById
);

/**
 * @swagger
 * /api/orders:
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
 *             type: object
 *             required:
 *               - items
 *               - tableNumber
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product
 *                     - quantity
 *                   properties:
 *                     product:
 *                       type: string
 *                       example: "60d5f7e1e4b0c8f8b8f8b8f8"
 *                     quantity:
 *                       type: number
 *                       example: 2
 *                     specialInstructions:
 *                       type: string
 *                       example: "Sin cebolla"
 *               tableNumber:
 *                 type: number
 *                 example: 5
 *               notes:
 *                 type: string
 *                 example: "Para llevar"
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, transfer, pending]
 *                 example: "card"
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
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/OrderDetailed'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.post(
  '/',
  authenticateToken,
  validateOrder,
  OrderController.createOrder
);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Actualizar estado del pedido
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderStatusUpdate'
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       404:
 *         description: Pedido no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos para actualizar este pedido
 */
router.put(
  '/:id/status',
  authenticateToken,
  validateObjectId('id'),
  requireOrderAccess,
  OrderController.updateOrderStatus
);

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Cancelar pedido
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
 *     responses:
 *       200:
 *         description: Pedido cancelado exitosamente
 *       404:
 *         description: Pedido no encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos para cancelar este pedido
 */
router.delete(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  requireOrderAccess,
  OrderController.cancelOrder
);

export default router;