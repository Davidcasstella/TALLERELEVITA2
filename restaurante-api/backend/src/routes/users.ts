import { Router } from 'express';
import UserController from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Rutas básicas con autenticación
router.get('/', authenticateToken, UserController.getAllUsers);
router.get('/:id', authenticateToken, UserController.getUserById);
router.put('/:id', authenticateToken, UserController.updateUser);
router.delete('/:id', authenticateToken, UserController.deleteUser);

export default router;