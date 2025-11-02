import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from './authController';
import { UserRole, ERROR_MESSAGES } from '../types/enums';
import { IUser } from '../types/interfaces';

/**
 * Controlador de Usuarios
 */
class UserController {
  /**
   * @desc    Obtener todos los usuarios
   * @route   GET /api/users
   * @access  Private/Admin
   */
  static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { role, isActive, page = 1, limit = 10 } = req.query;

      const query: any = {};
      
      if (role) {
        query.role = role;
      }
      
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 }),
        User.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit)
        }
      });
    } catch (error: any) {
      console.error('Error en getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener usuario por ID
   * @route   GET /api/users/:id
   * @access  Private/Admin
   */
  static async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select('-password');

      if (!user) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      console.error('Error en getUserById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
        error: error.message
      });
    }
  }

  /**
   * @desc    Crear nuevo usuario
   * @route   POST /api/users
   * @access  Private/Admin
   */
  static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, phone, address, role } = req.body;

      // Validaciones
      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Nombre, email y contraseña son obligatorios'
        });
        return;
      }

      // Validar fortaleza de contraseña
      const passwordValidation = User.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'La contraseña no cumple con los requisitos',
          errors: passwordValidation.errors
        });
        return;
      }

      // Verificar si el email ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
        return;
      }

      const userData: Partial<IUser> = {
        name,
        email,
        password,
        phone,
        address,
        role: role || UserRole.CUSTOMER
      };

      const user = await User.create(userData);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: user.getPublicProfile()
      });
    } catch (error: any) {
      console.error('Error en createUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear usuario',
        error: error.message
      });
    }
  }

  /**
   * @desc    Actualizar usuario
   * @route   PUT /api/users/:id
   * @access  Private/Admin
   */
  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, phone, address, role, isActive } = req.body;

      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND
        });
        return;
      }

      // Actualizar campos
      if (name) user.name = name;
      if (email && email !== user.email) {
        const emailExists = await User.findByEmail(email);
        if (emailExists) {
          res.status(400).json({
            success: false,
            message: 'El email ya está en uso'
          });
          return;
        }
        user.email = email;
      }
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
      if (role) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user.getPublicProfile()
      });
    } catch (error: any) {
      console.error('Error en updateUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar usuario',
        error: error.message
      });
    }
  }

  /**
   * @desc    Eliminar usuario (soft delete)
   * @route   DELETE /api/users/:id
   * @access  Private/Admin
   */
  static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // No permitir eliminar al mismo usuario
      if (req.user && req.user._id.toString() === id) {
        res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta'
        });
        return;
      }

      await User.softDelete(id);

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error: any) {
      console.error('Error en deleteUser:', error);
      
      if (error.message === ERROR_MESSAGES.USER_NOT_FOUND) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Error al eliminar usuario',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener estadísticas de usuarios
   * @route   GET /api/users/stats
   * @access  Private/Admin
   */
  static async getUserStats(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const countByRole = await User.countByRole();
      const totalUsers = await User.countDocuments({ isActive: true });
      const inactiveUsers = await User.countDocuments({ isActive: false });

      res.status(200).json({
        success: true,
        data: {
          total: totalUsers,
          inactive: inactiveUsers,
          byRole: countByRole
        }
      });
    } catch (error: any) {
      console.error('Error en getUserStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
}

export default UserController;