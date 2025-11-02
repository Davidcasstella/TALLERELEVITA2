"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.auth = exports.checkTokenExpiration = exports.logAuthAccess = exports.flexibleAuth = exports.requireSelfOrAdmin = exports.requireOwnershipOrAdmin = exports.optionalAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
class AuthMiddleware {
    static async authenticateToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).json({
                    success: false,
                    message: 'Token de acceso requerido. Por favor incluya el header Authorization.'
                });
                return;
            }
            if (!authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    success: false,
                    message: 'Formato de token inválido. Use: Bearer <token>'
                });
                return;
            }
            const token = authHeader.substring(7);
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: 'Token no proporcionado'
                });
                return;
            }
            let decoded;
            try {
                decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret-key-default');
            }
            catch (jwtError) {
                let message = 'Token inválido';
                if (jwtError.name === 'TokenExpiredError') {
                    message = 'Token expirado. Por favor inicie sesión nuevamente.';
                }
                else if (jwtError.name === 'JsonWebTokenError') {
                    message = 'Token malformado o inválido';
                }
                else if (jwtError.name === 'NotBeforeError') {
                    message = 'Token aún no es válido';
                }
                res.status(401).json({
                    success: false,
                    message
                });
                return;
            }
            const user = await User_1.default.findById(decoded.id).select('-password');
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
            req.user = user;
            req.token = token;
            next();
        }
        catch (error) {
            console.error('Error en authenticateToken:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al verificar autenticación'
            });
        }
    }
    static async optionalAuth(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = undefined;
            next();
            return;
        }
        AuthMiddleware.authenticateToken(req, res, next);
    }
    static requireOwnershipOrAdmin(resourceUserIdField = 'userId') {
        return (req, res, next) => {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida'
                });
                return;
            }
            if (req.user.role === 'admin') {
                next();
                return;
            }
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
    static requireSelfOrAdmin(req, res, next) {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
            return;
        }
        if (req.user.role === 'admin') {
            next();
            return;
        }
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
    static async flexibleAuth(req, res, next) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            AuthMiddleware.authenticateToken(req, res, next);
            return;
        }
        res.status(401).json({
            success: false,
            message: 'Método de autenticación requerido'
        });
    }
    static logAuthAccess(req, _res, next) {
        if (req.user) {
            console.log(`🔐 Usuario autenticado: ${req.user.email} (${req.user.role}) - ${req.method} ${req.originalUrl}`);
        }
        next();
    }
    static checkTokenExpiration(req, res, next) {
        if (req.user && req.token) {
            try {
                const decoded = jsonwebtoken_1.default.decode(req.token);
                const now = Math.floor(Date.now() / 1000);
                const timeToExpire = decoded.exp - now;
                if (timeToExpire < 30 * 60) {
                    res.set('X-Token-Refresh-Suggested', 'true');
                    res.set('X-Token-Expires-In', timeToExpire.toString());
                }
            }
            catch (error) {
            }
        }
        next();
    }
}
exports.default = AuthMiddleware;
exports.authenticateToken = AuthMiddleware.authenticateToken;
exports.optionalAuth = AuthMiddleware.optionalAuth;
exports.requireOwnershipOrAdmin = AuthMiddleware.requireOwnershipOrAdmin;
exports.requireSelfOrAdmin = AuthMiddleware.requireSelfOrAdmin;
exports.flexibleAuth = AuthMiddleware.flexibleAuth;
exports.logAuthAccess = AuthMiddleware.logAuthAccess;
exports.checkTokenExpiration = AuthMiddleware.checkTokenExpiration;
exports.auth = AuthMiddleware.authenticateToken;
exports.protect = AuthMiddleware.authenticateToken;
//# sourceMappingURL=authMiddleware.js.map