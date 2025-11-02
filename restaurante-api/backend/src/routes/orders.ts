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
 * Rutas de pedidos
 */

// Obtener pedidos (clientes ven solo los suyos, empleados ven todos)
router.get(
  '/',
  authenticateToken,
  validateSearchQuery,
  OrderController.getAllOrders
);

// Obtener pedido por ID (con verificación de permisos)
router.get(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  requireOrderAccess,
  OrderController.getOrderById
);

// Crear pedido (cualquier usuario autenticado)
router.post(
  '/',
  authenticateToken,
  validateOrder,
  OrderController.createOrder
);

// Actualizar pedido (empleados pueden actualizar cualquiera, clientes solo los suyos)
// Nota: Si necesitas un método updateOrder completo, agrégalo al controlador
router.put(
  '/:id/status',
  authenticateToken,
  validateObjectId('id'),
  requireOrderAccess,
  OrderController.updateOrderStatus
);

// Eliminar/cancelar pedido
router.delete(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  requireOrderAccess,
  OrderController.cancelOrder
);

export default router;