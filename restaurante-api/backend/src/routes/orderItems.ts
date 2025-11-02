import { Router } from 'express';
import OrderItemController from '../controllers/orderItemController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireEmployee, requireKitchenStaff } from '../middleware/roleMiddleware';
import { validateObjectId } from '../middleware/validationMiddleware';

const router = Router();

/**
 * Rutas de items de pedido
 */

// Obtener items (principalmente para empleados de cocina)
router.get(
  '/',
  authenticateToken,
  requireEmployee,
  OrderItemController.getAllOrderItems
);

// Obtener item por ID
router.get(
  '/:id',
  authenticateToken,
  requireEmployee,
  validateObjectId('id'),
  OrderItemController.getOrderItemById
);

// Actualizar estado de preparación de un item
router.put(
  '/:id/status',
  authenticateToken,
  requireEmployee,
  validateObjectId('id'),
  OrderItemController.updatePreparationStatus
);

// Obtener items pendientes para cocina
router.get(
  '/kitchen/pending',
  authenticateToken,
  requireKitchenStaff,
  OrderItemController.getPendingForKitchen
);

export default router;