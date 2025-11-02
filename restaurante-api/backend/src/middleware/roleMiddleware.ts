import { Response, NextFunction } from 'express';
import { AuthRequest } from '../controllers/authController';
import { UserRole } from '../types/enums';
import Order from '../models/Order';

/**
 * Interface para condiciones de roles
 */
interface RoleCondition {
  check: (req: AuthRequest) => boolean;
  allowedRoles: UserRole[];
}

/**
 * Clase RoleMiddleware
 * Maneja toda la lógica de autorización basada en roles
 */
class RoleMiddleware {
  /**
   * Verifica que el usuario tenga uno de los roles especificados
   */
  static requireRole(...allowedRoles: UserRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      // Verificar que hay usuario autenticado
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticación requerida para acceder a este recurso'
        });
        return;
      }

      // Verificar que el usuario tenga un rol válido
      if (!req.user.role) {
        res.status(403).json({
          success: false,
          message: 'Usuario sin rol asignado. Contacte al administrador.'
        });
        return;
      }

      // Verificar que el rol del usuario esté en los roles permitidos
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(', ')}. Su rol actual: ${req.user.role}`
        });
        return;
      }

      next();
    };
  }

  /**
   * Middleware específico para solo administradores
   */
  static requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
      return;
    }

    if (req.user.role !== UserRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo administradores pueden realizar esta acción.'
      });
      return;
    }

    next();
  }

  /**
   * Middleware para empleados (waiter, chef, admin)
   */
  static requireEmployee(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
      return;
    }

    const employeeRoles: UserRole[] = [UserRole.WAITER, UserRole.CHEF, UserRole.ADMIN];

    if (!employeeRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo empleados pueden realizar esta acción.'
      });
      return;
    }

    next();
  }

  /**
   * Middleware para clientes (solo clientes, no empleados)
   */
  static requireCustomer(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
      return;
    }

    if (req.user.role !== UserRole.CUSTOMER) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo clientes pueden realizar esta acción.'
      });
      return;
    }

    next();
  }

  /**
   * Middleware para personal de cocina (chef y admin)
   */
  static requireKitchenStaff(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
      return;
    }

    const kitchenRoles: UserRole[] = [UserRole.CHEF, UserRole.ADMIN];

    if (!kitchenRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo personal de cocina puede realizar esta acción.'
      });
      return;
    }

    next();
  }

  /**
   * Middleware para meseros y administradores
   */
  static requireWaiterOrAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
      return;
    }

    const allowedRoles: UserRole[] = [UserRole.WAITER, UserRole.ADMIN];

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo meseros y administradores pueden realizar esta acción.'
      });
      return;
    }

    next();
  }

  /**
   * Middleware condicional basado en el recurso
   * Permite diferentes niveles de acceso según el contexto
   */
  static conditionalRole(conditions: RoleCondition[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticación requerida'
        });
        return;
      }

      // Verificar condiciones específicas
      for (const condition of conditions) {
        if (condition.check(req)) {
          if (condition.allowedRoles.includes(req.user.role)) {
            next();
            return;
          }
        }
      }

      res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción en este contexto'
      });
    };
  }

  /**
   * Middleware para verificar ownership de pedidos
   * Un cliente solo puede ver/modificar sus propios pedidos
   * Los empleados pueden ver/modificar cualquier pedido
   */
  static async requireOrderAccess(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
      return;
    }

    // Empleados tienen acceso completo
    const employeeRoles: UserRole[] = [UserRole.WAITER, UserRole.CHEF, UserRole.ADMIN];
    if (employeeRoles.includes(req.user.role)) {
      next();
      return;
    }

    // Para clientes, verificar que el pedido les pertenece
    if (req.user.role === UserRole.CUSTOMER) {
      try {
        const orderId = req.params.id || req.params.orderId;

        if (!orderId) {
          res.status(400).json({
            success: false,
            message: 'ID de pedido requerido'
          });
          return;
        }

        const order = await Order.findById(orderId);

        if (!order) {
          res.status(404).json({
            success: false,
            message: 'Pedido no encontrado'
          });
          return;
        }

        if (order.customer.toString() !== req.user._id.toString()) {
          res.status(403).json({
            success: false,
            message: 'No tiene permisos para acceder a este pedido'
          });
          return;
        }

        next();
        return;
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error al verificar permisos del pedido'
        });
        return;
      }
    }

    res.status(403).json({
      success: false,
      message: 'Rol no reconocido'
    });
  }

  /**
   * Middleware para verificar permisos de gestión de menú
   * Solo chef y admin pueden crear/editar productos
   * Waiters pueden ver disponibilidad
   */
  static requireMenuManagement(action: 'view' | 'create' | 'update' | 'delete' | 'availability') {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Autenticación requerida'
        });
        return;
      }

      const permissions: Record<string, UserRole[]> = {
        view: [UserRole.CUSTOMER, UserRole.WAITER, UserRole.CHEF, UserRole.ADMIN],
        create: [UserRole.CHEF, UserRole.ADMIN],
        update: [UserRole.CHEF, UserRole.ADMIN],
        delete: [UserRole.ADMIN],
        availability: [UserRole.WAITER, UserRole.CHEF, UserRole.ADMIN]
      };

      const allowedRoles = permissions[action] || [];

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: `No tiene permisos para ${action} productos del menú`
        });
        return;
      }

      next();
    };
  }

  /**
   * Middleware de logging para acciones por rol
   */
  static logRoleAction(action: string) {
    return (req: AuthRequest, _res: Response, next: NextFunction): void => {
      if (req.user) {
        console.log(`👤 ${req.user.role.toUpperCase()} (${req.user.email}) - ${action} - ${req.method} ${req.originalUrl}`);
      }
      next();
    };
  }

  /**
   * Middleware para verificar jerarquía de roles
   * Un usuario no puede modificar a alguien de rol superior
   */
  static requireRoleHierarchy(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
      return;
    }

    // Admin puede modificar a cualquiera
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    // Obtener el rol del usuario objetivo
    const targetRole = req.body.role || req.params.role;

    if (!targetRole) {
      next(); // Si no se especifica rol, continuar
      return;
    }

    // Jerarquía de roles (mayor número = mayor jerarquía)
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.CUSTOMER]: 1,
      [UserRole.WAITER]: 2,
      [UserRole.CHEF]: 2,
      [UserRole.ADMIN]: 3
    };

    const userLevel = roleHierarchy[req.user.role] || 0;
    const targetLevel = roleHierarchy[targetRole as UserRole] || 0;

    if (userLevel < targetLevel) {
      res.status(403).json({
        success: false,
        message: 'No puede asignar o modificar usuarios con rol superior al suyo'
      });
      return;
    }

    next();
  }
}

// Exportar clase por defecto
export default RoleMiddleware;

// Exports nombrados para compatibilidad
export const requireRole = RoleMiddleware.requireRole;
export const requireAdmin = RoleMiddleware.requireAdmin;
export const requireEmployee = RoleMiddleware.requireEmployee;
export const requireCustomer = RoleMiddleware.requireCustomer;
export const requireKitchenStaff = RoleMiddleware.requireKitchenStaff;
export const requireWaiterOrAdmin = RoleMiddleware.requireWaiterOrAdmin;
export const conditionalRole = RoleMiddleware.conditionalRole;
export const requireOrderAccess = RoleMiddleware.requireOrderAccess;
export const requireMenuManagement = RoleMiddleware.requireMenuManagement;
export const requireRoleHierarchy = RoleMiddleware.requireRoleHierarchy;
export const logRoleAction = RoleMiddleware.logRoleAction;

// Aliases comunes
export const admin = RoleMiddleware.requireAdmin;
export const employee = RoleMiddleware.requireEmployee;
export const customer = RoleMiddleware.requireCustomer;
export const kitchen = RoleMiddleware.requireKitchenStaff;
export const waiter = RoleMiddleware.requireWaiterOrAdmin;