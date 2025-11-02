"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waiter = exports.kitchen = exports.customer = exports.employee = exports.admin = exports.logRoleAction = exports.requireRoleHierarchy = exports.requireMenuManagement = exports.requireOrderAccess = exports.conditionalRole = exports.requireWaiterOrAdmin = exports.requireKitchenStaff = exports.requireCustomer = exports.requireEmployee = exports.requireAdmin = exports.requireRole = void 0;
const enums_1 = require("../types/enums");
const Order_1 = __importDefault(require("../models/Order"));
class RoleMiddleware {
    static requireRole(...allowedRoles) {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida para acceder a este recurso'
                });
                return;
            }
            if (!req.user.role) {
                res.status(403).json({
                    success: false,
                    message: 'Usuario sin rol asignado. Contacte al administrador.'
                });
                return;
            }
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
    static requireAdmin(req, res, next) {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
            return;
        }
        if (req.user.role !== enums_1.UserRole.ADMIN) {
            res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden realizar esta acción.'
            });
            return;
        }
        next();
    }
    static requireEmployee(req, res, next) {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
            return;
        }
        const employeeRoles = [enums_1.UserRole.WAITER, enums_1.UserRole.CHEF, enums_1.UserRole.ADMIN];
        if (!employeeRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo empleados pueden realizar esta acción.'
            });
            return;
        }
        next();
    }
    static requireCustomer(req, res, next) {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
            return;
        }
        if (req.user.role !== enums_1.UserRole.CUSTOMER) {
            res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo clientes pueden realizar esta acción.'
            });
            return;
        }
        next();
    }
    static requireKitchenStaff(req, res, next) {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
            return;
        }
        const kitchenRoles = [enums_1.UserRole.CHEF, enums_1.UserRole.ADMIN];
        if (!kitchenRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo personal de cocina puede realizar esta acción.'
            });
            return;
        }
        next();
    }
    static requireWaiterOrAdmin(req, res, next) {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
            return;
        }
        const allowedRoles = [enums_1.UserRole.WAITER, enums_1.UserRole.ADMIN];
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo meseros y administradores pueden realizar esta acción.'
            });
            return;
        }
        next();
    }
    static conditionalRole(conditions) {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida'
                });
                return;
            }
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
    static async requireOrderAccess(req, res, next) {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
            return;
        }
        const employeeRoles = [enums_1.UserRole.WAITER, enums_1.UserRole.CHEF, enums_1.UserRole.ADMIN];
        if (employeeRoles.includes(req.user.role)) {
            next();
            return;
        }
        if (req.user.role === enums_1.UserRole.CUSTOMER) {
            try {
                const orderId = req.params.id || req.params.orderId;
                if (!orderId) {
                    res.status(400).json({
                        success: false,
                        message: 'ID de pedido requerido'
                    });
                    return;
                }
                const order = await Order_1.default.findById(orderId);
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
            }
            catch (error) {
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
    static requireMenuManagement(action) {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida'
                });
                return;
            }
            const permissions = {
                view: [enums_1.UserRole.CUSTOMER, enums_1.UserRole.WAITER, enums_1.UserRole.CHEF, enums_1.UserRole.ADMIN],
                create: [enums_1.UserRole.CHEF, enums_1.UserRole.ADMIN],
                update: [enums_1.UserRole.CHEF, enums_1.UserRole.ADMIN],
                delete: [enums_1.UserRole.ADMIN],
                availability: [enums_1.UserRole.WAITER, enums_1.UserRole.CHEF, enums_1.UserRole.ADMIN]
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
    static logRoleAction(action) {
        return (req, _res, next) => {
            if (req.user) {
                console.log(`👤 ${req.user.role.toUpperCase()} (${req.user.email}) - ${action} - ${req.method} ${req.originalUrl}`);
            }
            next();
        };
    }
    static requireRoleHierarchy(req, res, next) {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
            return;
        }
        if (req.user.role === enums_1.UserRole.ADMIN) {
            next();
            return;
        }
        const targetRole = req.body.role || req.params.role;
        if (!targetRole) {
            next();
            return;
        }
        const roleHierarchy = {
            [enums_1.UserRole.CUSTOMER]: 1,
            [enums_1.UserRole.WAITER]: 2,
            [enums_1.UserRole.CHEF]: 2,
            [enums_1.UserRole.ADMIN]: 3
        };
        const userLevel = roleHierarchy[req.user.role] || 0;
        const targetLevel = roleHierarchy[targetRole] || 0;
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
exports.default = RoleMiddleware;
exports.requireRole = RoleMiddleware.requireRole;
exports.requireAdmin = RoleMiddleware.requireAdmin;
exports.requireEmployee = RoleMiddleware.requireEmployee;
exports.requireCustomer = RoleMiddleware.requireCustomer;
exports.requireKitchenStaff = RoleMiddleware.requireKitchenStaff;
exports.requireWaiterOrAdmin = RoleMiddleware.requireWaiterOrAdmin;
exports.conditionalRole = RoleMiddleware.conditionalRole;
exports.requireOrderAccess = RoleMiddleware.requireOrderAccess;
exports.requireMenuManagement = RoleMiddleware.requireMenuManagement;
exports.requireRoleHierarchy = RoleMiddleware.requireRoleHierarchy;
exports.logRoleAction = RoleMiddleware.logRoleAction;
exports.admin = RoleMiddleware.requireAdmin;
exports.employee = RoleMiddleware.requireEmployee;
exports.customer = RoleMiddleware.requireCustomer;
exports.kitchen = RoleMiddleware.requireKitchenStaff;
exports.waiter = RoleMiddleware.requireWaiterOrAdmin;
//# sourceMappingURL=roleMiddleware.js.map