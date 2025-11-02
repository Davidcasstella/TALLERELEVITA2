import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../types/interfaces';
import { UserRole, ERROR_MESSAGES } from '../types/enums';

/**
 * Interface para extender Request con usuario autenticado
 */
export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Interface para el payload del JWT
 */
interface JWTPayload {
  id: string;
  role: UserRole;
}

/**
 * Clase de servicio para autenticación
 */
class AuthService {
  /**
   * Genera un token JWT
   */
  static generateToken(userId: string, role: UserRole): string {
    const payload: JWTPayload = { id: userId, role };
    const secret = process.env.JWT_SECRET || 'secret-key-default';
    
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  /**
   * Verifica un token JWT
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(
        token, 
        process.env.JWT_SECRET || 'secret-key-default'
      ) as JWTPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extrae el token del header Authorization
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

/**
 * Controlador de Autenticación
 */
class AuthController {
  /**
   * @desc    Registrar nuevo usuario
   * @route   POST /api/auth/register
   * @access  Public
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone, address, role } = req.body;

      // Validaciones
      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'Por favor proporcione nombre, email y contraseña'
        });
        return;
      }

      // ✅ CORREGIDO: Validación simple de contraseña
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
        return;
      }

      // ✅ CORREGIDO: Usar findOne en lugar de findByEmail
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
        return;
      }

      // Crear usuario
      const userData: Partial<IUser> = {
        name,
        email,
        password,
        phone,
        address,
        role: role || UserRole.CUSTOMER
      };

      const user = await User.create(userData);

      // Generar token
      const token = AuthService.generateToken(user._id.toString(), user.role);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: user.getPublicProfile(),
          token
        }
      });
    } catch (error: any) {
      console.error('Error en register:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
        error: error.message
      });
    }
  }

  /**
   * @desc    Login de usuario
   * @route   POST /api/auth/login
   * @access  Public
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validaciones
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Por favor proporcione email y contraseña'
        });
        return;
      }

      // ✅ CORREGIDO: Usar findOne con select('+password')
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
        return;
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Usuario inactivo. Contacte al administrador'
        });
        return;
      }

      // Verificar contraseña
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
        return;
      }

      // Generar token
      const token = AuthService.generateToken(user._id.toString(), user.role);

      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: user.getPublicProfile(),
          token
        }
      });
    } catch (error: any) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener perfil del usuario autenticado
   * @route   GET /api/auth/profile
   * @access  Private
   */
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED
        });
        return;
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user.getPublicProfile()
      });
    } catch (error: any) {
      console.error('Error en getProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil',
        error: error.message
      });
    }
  }

  /**
   * @desc    Actualizar perfil del usuario autenticado
   * @route   PUT /api/auth/profile
   * @access  Private
   */
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED
        });
        return;
      }

      const { name, phone, address } = req.body;

      const user = await User.findById(req.user._id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND
        });
        return;
      }

      // Actualizar campos permitidos
      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: user.getPublicProfile()
      });
    } catch (error: any) {
      console.error('Error en updateProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar perfil',
        error: error.message
      });
    }
  }

  /**
   * @desc    Cambiar contraseña
   * @route   PUT /api/auth/change-password
   * @access  Private
   */
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Validaciones
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Debe proporcionar contraseña actual y nueva'
        });
        return;
      }

      // ✅ CORREGIDO: Validación simple de contraseña
      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
        return;
      }

      // ✅ CORREGIDO: Usar findById con select('+password')
      const user = await User.findById(req.user._id).select('+password');

      if (!user) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND
        });
        return;
      }

      // Verificar contraseña actual
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
        return;
      }

      // Actualizar contraseña
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error: any) {
      console.error('Error en changePassword:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña',
        error: error.message
      });
    }
  }

  /**
   * @desc    Verificar token
   * @route   GET /api/auth/verify-token
   * @access  Private
   */
  static async verifyToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Token válido',
        data: {
          user: req.user
        }
      });
    } catch (error: any) {
      console.error('Error en verifyToken:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar token',
        error: error.message
      });
    }
  }

  /**
   * @desc    Logout (del lado del cliente)
   * @route   POST /api/auth/logout
   * @access  Private
   */
  static async logout(_req: AuthRequest, res: Response): Promise<void> {
    try {
      // El logout se maneja del lado del cliente eliminando el token
      res.status(200).json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error: any) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión',
        error: error.message
      });
    }
  }
}

// Exportar tanto el controlador como el servicio
export { AuthService };
export default AuthController;