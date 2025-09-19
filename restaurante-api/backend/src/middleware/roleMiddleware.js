/**
 * Middleware para autorización basada en roles
 * Se debe usar DESPUÉS del middleware de autenticación
 */

/**
 * Verifica que el usuario tenga uno de los roles especificados
 * @param  {...string} allowedRoles - Roles permitidos
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Verificar que hay usuario autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida para acceder a este recurso'
      });
    }

    // Verificar que el usuario tenga un rol válido
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Usuario sin rol asignado. Contacte al administrador.'
      });
    }

    // Verificar que el rol del usuario esté en los roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de estos roles: ${allowedRoles.join(', ')}. Su rol actual: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Middleware específico para solo administradores
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores pueden realizar esta acción.'
    });
  }

  next();
};

/**
 * Middleware para empleados (waiter, chef, admin)
 */
const requireEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  const employeeRoles = ['waiter', 'chef', 'admin'];
  
  if (!employeeRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo empleados pueden realizar esta acción.'
    });
  }

  next();
};

/**
 * Middleware para clientes (solo clientes, no empleados)
 */
const requireCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo clientes pueden realizar esta acción.'
    });
  }

  next();
};

/**
 * Middleware para personal de cocina (chef y admin)
 */
const requireKitchenStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  const kitchenRoles = ['chef', 'admin'];
  
  if (!kitchenRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo personal de cocina puede realizar esta acción.'
    });
  }

  next();
};

/**
 * Middleware para meseros y administradores
 */
const requireWaiterOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  const allowedRoles = ['waiter', 'admin'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo meseros y administradores pueden realizar esta acción.'
    });
  }

  next();
};

/**
 * Middleware condicional basado en el recurso
 * Permite diferentes niveles de acceso según el contexto
 */
const conditionalRole = (conditions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    // Verificar condiciones específicas
    for (const condition of conditions) {
      if (condition.check(req)) {
        if (condition.allowedRoles.includes(req.user.role)) {
          return next();
        }
      }
    }

    return res.status(403).json({
      success: false,
      message: 'No tiene permisos para realizar esta acción en este contexto'
    });
  };
};

/**
 * Middleware para verificar ownership de pedidos
 * Un cliente solo puede ver/modificar sus propios pedidos
 * Los empleados pueden ver/modificar cualquier pedido
 */
const requireOrderAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  // Empleados tienen acceso completo
  const employeeRoles = ['waiter', 'chef', 'admin'];
  if (employeeRoles.includes(req.user.role)) {
    return next();
  }

  // Para clientes, verificar que el pedido les pertenece
  if (req.user.role === 'customer') {
    try {
      const Order = require('../models/Order');
      const orderId = req.params.id || req.params.orderId;
      
      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'ID de pedido requerido'
        });
      }

      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      if (order.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para acceder a este pedido'
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos del pedido'
      });
    }
  }

  return res.status(403).json({
    success: false,
    message: 'Rol no reconocido'
  });
};

/**
 * Middleware para verificar permisos de gestión de menú
 * Solo chef y admin pueden crear/editar productos
 * Waiters pueden ver disponibilidad
 */
const requireMenuManagement = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    const permissions = {
      view: ['customer', 'waiter', 'chef', 'admin'],
      create: ['chef', 'admin'],
      update: ['chef', 'admin'],
      delete: ['admin'],
      availability: ['waiter', 'chef', 'admin']
    };

    const allowedRoles = permissions[action] || [];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `No tiene permisos para ${action} productos del menú`
      });
    }

    next();
  };
};

/**
 * Middleware de logging para acciones por rol
 */
const logRoleAction = (action) => {
  return (req, res, next) => {
    if (req.user) {
      console.log(`👤 ${req.user.role.toUpperCase()} (${req.user.email}) - ${action} - ${req.method} ${req.originalUrl}`);
    }
    next();
  };
};

/**
 * Middleware para verificar jerarquía de roles
 * Un usuario no puede modificar a alguien de rol superior
 */
const requireRoleHierarchy = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  // Admin puede modificar a cualquiera
  if (req.user.role === 'admin') {
    return next();
  }

  // Obtener el rol del usuario objetivo
  const targetRole = req.body.role || req.params.role;
  
  if (!targetRole) {
    return next(); // Si no se especifica rol, continuar
  }

  // Jerarquía de roles (mayor número = mayor jerarquía)
  const roleHierarchy = {
    customer: 1,
    waiter: 2,
    chef: 2,
    admin: 3
  };

  const userLevel = roleHierarchy[req.user.role] || 0;
  const targetLevel = roleHierarchy[targetRole] || 0;

  if (userLevel < targetLevel) {
    return res.status(403).json({
      success: false,
      message: 'No puede asignar o modificar usuarios con rol superior al suyo'
    });
  }

  next();
};

module.exports = {
  requireRole,
  requireAdmin,
  requireEmployee,
  requireCustomer,
  requireKitchenStaff,
  requireWaiterOrAdmin,
  conditionalRole,
  requireOrderAccess,
  requireMenuManagement,
  requireRoleHierarchy,
  logRoleAction,
  // Aliases comunes
  admin: requireAdmin,
  employee: requireEmployee,
  customer: requireCustomer,
  kitchen: requireKitchenStaff,
  waiter: requireWaiterOrAdmin
};