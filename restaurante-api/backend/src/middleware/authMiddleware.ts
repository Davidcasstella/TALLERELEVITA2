import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../controllers/authController';
import { IUser } from '../types/interfaces';

/**
 * Interface extendida de Request con usuario autenticado
 */
export interface AuthRequestWithToken extends AuthRequest {
  token?: string;
}

/**
 * Interface para el payload decodificado del JWT
 */
interface JWTPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Clase AuthMiddleware
 * Maneja toda la lógica de autenticación mediante JWT
 */
class AuthMiddleware {
  /**
   * Middleware principal de autenticación
   * Verifica el token JWT y adjunta el usuario al request
   */
  static async authenticateToken(req: AuthRequestWithToken, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Obtener token del header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'Token de acceso requerido. Por favor incluya el header Authorization.'
        });
        return;
      }

      // Verificar formato: "Bearer TOKEN"
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Formato de token inválido. Use: Bearer <token>'
        });
        return;
      }

      // Extraer el token
      const token = authHeader.substring(7); // Remover "Bearer "

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Token no proporcionado'
        });
        return;
      }

      // 2. Verificar y decodificar el token
      let decoded: JWTPayload;
      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'secret-key-default'
        ) as JWTPayload;
      } catch (jwtError: any) {
        let message = 'Token inválido';

        if (jwtError.name === 'TokenExpiredError') {
          message = 'Token expirado. Por favor inicie sesión nuevamente.';
        } else if (jwtError.name === 'JsonWebTokenError') {
          message = 'Token malformado o inválido';
        } else if (jwtError.name === 'NotBeforeError') {
          message = 'Token aún no es válido';
        }

        res.status(401).json({
          success: false,
          message
        });
        return;
      }

      // 3. Verificar que el usuario aún existe y está activo
      const user = await User.findById(decoded.id).select('-password') as IUser | null;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no encontrado. Token inválido.'
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Cuenta desactivada. Contacte al administrador.'
        });
        return;
      }

      // 4. Verificar que el token no haya sido emitido antes de un cambio de contraseña
      if (decoded.iat && user.passwordChangedAt) {
        const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);

        if (decoded.iat < passwordChangedTimestamp) {
          res.status(401).json({
            success: false,
            message: 'Contraseña cambiada recientemente. Por favor inicie sesión nuevamente.'
          });
          return;
        }
      }

      // 5. Agregar información del usuario al request
      req.user = user;
      req.token = token;

      next();
    } catch (error) {
      console.error('Error en authenticateToken:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar autenticación'
      });
    }
  }

  /**
   * Middleware opcional de autenticación
   * Si hay token lo verifica, si no hay token continúa sin usuario
   */
  static async optionalAuth(req: AuthRequestWithToken, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = undefined;
      next();
      return;
    }

    // Si hay token, usar el middleware normal
    AuthMiddleware.authenticateToken(req, res, next);
  }

  /**
   * Middleware para verificar que el usuario sea el propietario del recurso o admin
   */
  static requireOwnershipOrAdmin(resourceUserIdField: string = 'userId') {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticación requerida'
        });
        return;
      }

      // Si es admin, puede acceder a todo
      if (req.user.role === 'admin') {
        next();
        return;
      }

      // Verificar ownership
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

      if (!resourceUserId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario requerido en el recurso'
        });
        return;
      }

      if (req.user._id.toString() !== resourceUserId.toString()) {
        res.status(403).json({
          success: false,
          message: 'No tiene permisos para acceder a este recurso'
        });
        return;
      }

      next();
    };
  }

  /**
   * Middleware para verificar que el usuario autenticado sea el mismo del parámetro
   */
  static requireSelfOrAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
      return;
    }

    // Si es admin, puede acceder a cualquier usuario
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Si intenta acceder a su propio perfil
    const targetUserId = req.params.id || req.params.userId;

    if (req.user._id.toString() === targetUserId) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'Solo puede acceder a su propio perfil'
    });
  }

  /**
   * Middleware para verificar múltiples tokens o API keys (futuro)
   */
  static async flexibleAuth(req: AuthRequestWithToken, res: Response, next: NextFunction): Promise<void> {
    // Intentar autenticación JWT primero
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      AuthMiddleware.authenticateToken(req, res, next);
      return;
    }

    // Aquí podrías agregar otros métodos de autenticación
    // Como API keys, OAuth, etc.

    res.status(401).json({
      success: false,
      message: 'Método de autenticación requerido'
    });
  }

  /**
   * Middleware para logging de accesos autenticados
   */
  static logAuthAccess(req: AuthRequest, _res: Response, next: NextFunction): void {
    if (req.user) {
      console.log(`🔐 Usuario autenticado: ${req.user.email} (${req.user.role}) - ${req.method} ${req.originalUrl}`);
    }
    next();
  }

  /**
   * Middleware para refresh de tokens cercanos a expirar
   */
  static checkTokenExpiration(req: AuthRequestWithToken, res: Response, next: NextFunction): void {
    if (req.user && req.token) {
      try {
        const decoded = jwt.decode(req.token) as JWTPayload;
        const now = Math.floor(Date.now() / 1000);
        const timeToExpire = decoded.exp - now;

        // Si el token expira en menos de 30 minutos, agregar header sugerencia
        if (timeToExpire < 30 * 60) {
          res.set('X-Token-Refresh-Suggested', 'true');
          res.set('X-Token-Expires-In', timeToExpire.toString());
        }
      } catch (error) {
        // No hacer nada si no se puede decodificar
      }
    }
    next();
  }
}

// Exportar métodos individuales y aliases
export default AuthMiddleware;

// Exports nombrados para compatibilidad
export const authenticateToken = AuthMiddleware.authenticateToken;
export const optionalAuth = AuthMiddleware.optionalAuth;
export const requireOwnershipOrAdmin = AuthMiddleware.requireOwnershipOrAdmin;
export const requireSelfOrAdmin = AuthMiddleware.requireSelfOrAdmin;
export const flexibleAuth = AuthMiddleware.flexibleAuth;
export const logAuthAccess = AuthMiddleware.logAuthAccess;
export const checkTokenExpiration = AuthMiddleware.checkTokenExpiration;

// Aliases para compatibilidad
export const auth = AuthMiddleware.authenticateToken;
export const protect = AuthMiddleware.authenticateToken;