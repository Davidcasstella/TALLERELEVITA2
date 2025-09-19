const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin, requireMenuManagement } = require('../middleware/roleMiddleware');
const { validateProduct, validateObjectId, validateSearchQuery } = require('../middleware/validationMiddleware');

// Obtener productos (todos los usuarios autenticados pueden ver)
router.get('/', 
  authenticateToken, 
  validateSearchQuery,
  productController.getProducts
);

// Obtener producto por ID (todos los usuarios autenticados)
router.get('/:id', 
  authenticateToken, 
  validateObjectId('id'),
  productController.getProductById
);

// Crear producto (solo admin y chef)
router.post('/', 
  authenticateToken, 
  requireMenuManagement('create'),
  validateProduct,
  productController.createProduct
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