const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireEmployee, requireOrderAccess, requireWaiterOrAdmin } = require('../middleware/roleMiddleware');
const { validateOrder, validateOrderStatus, validateObjectId, validateSearchQuery } = require('../middleware/validationMiddleware');

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

// Actualizar solo el estado del pedido (solo empleados)
router.patch('/:id/status', 
  authenticateToken, 
  validateObjectId('id'),
  requireEmployee,
  validateOrderStatus,
  orderController.updateOrderStatus
);

// Eliminar/Cancelar pedido
router.delete('/:id', 
  authenticateToken, 
  validateObjectId('id'),
  requireOrderAccess,
  orderController.deleteOrder
);

// Obtener estadísticas de pedidos (solo empleados)
router.get('/stats/dashboard', 
  authenticateToken, 
  requireEmployee,
  orderController.getOrderStats
);

module.exports = router;