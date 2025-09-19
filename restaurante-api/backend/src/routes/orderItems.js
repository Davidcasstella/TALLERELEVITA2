const express = require('express');
const router = express.Router();
const orderItemController = require('../controllers/orderItemController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireEmployee, requireKitchenStaff } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

// Obtener items (principalmente para empleados de cocina)
router.get('/', 
  authenticateToken, 
  requireEmployee,
  orderItemController.getOrderItems
);

// Obtener item por ID
router.get('/:id', 
  authenticateToken, 
  requireEmployee,
  validateObjectId('id'),
  orderItemController.getOrderItemById
);

// Crear item (agregar item a pedido existente)
router.post('/', 
  authenticateToken, 
  requireEmployee,
  orderItemController.createOrderItem
);

// Actualizar item (cambiar estado de preparación, etc.)
router.put('/:id', 
  authenticateToken, 
  requireEmployee,
  validateObjectId('id'),
  orderItemController.updateOrderItem
);

// Eliminar item de pedido
router.delete('/:id', 
  authenticateToken, 
  requireEmployee,
  validateObjectId('id'),
  orderItemController.deleteOrderItem
);

// Rutas específicas para cocina
router.get('/kitchen/queue', 
  authenticateToken, 
  requireKitchenStaff,
  orderItemController.getKitchenQueue
);

// Items asignados a un chef específico
router.get('/chef/:chefId', 
  authenticateToken, 
  requireKitchenStaff,
  validateObjectId('chefId'),
  orderItemController.getChefItems
);

// Items del chef autenticado
router.get('/my/items', 
  authenticateToken, 
  requireKitchenStaff,
  orderItemController.getChefItems
);

module.exports = router;