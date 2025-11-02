"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const enums_1 = require("../types/enums");
class AuthService {
    static generateToken(userId, role) {
        const payload = { id: userId, role };
        const secret = process.env.JWT_SECRET || 'secret-key-default';
        return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '7d' });
    }
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret-key-default');
        }
        catch (error) {
            return null;
        }
    }
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}
exports.AuthService = AuthService;
class AuthController {
    static async register(req, res) {
        try {
            const { name, email, password, phone, address, role } = req.body;
            if (!name || !email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Por favor proporcione nombre, email y contraseña'
                });
                return;
            }
            if (password.length < 6) {
                res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
                return;
            }
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
                return;
            }
            const userData = {
                name,
                email,
                password,
                phone,
                address,
                role: role || enums_1.UserRole.CUSTOMER
            };
            const user = await User_1.default.create(userData);
            const token = AuthService.generateToken(user._id.toString(), user.role);
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    user: user.getPublicProfile(),
                    token
                }
            });
        }
        catch (error) {
            console.error('Error en register:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar usuario',
                error: error.message
            });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Por favor proporcione email y contraseña'
                });
                return;
            }
            const user = await User_1.default.findOne({ email }).select('+password');
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
                return;
            }
            if (!user.isActive) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario inactivo. Contacte al administrador'
                });
                return;
            }
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
                return;
            }
            const token = AuthService.generateToken(user._id.toString(), user.role);
            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    user: user.getPublicProfile(),
                    token
                }
            });
        }
        catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error al iniciar sesión',
                error: error.message
            });
        }
    }
    static async getProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.UNAUTHORIZED
                });
                return;
            }
            const user = await User_1.default.findById(req.user._id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.USER_NOT_FOUND
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: user.getPublicProfile()
            });
        }
        catch (error) {
            console.error('Error en getProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener perfil',
                error: error.message
            });
        }
    }
    static async updateProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.UNAUTHORIZED
                });
                return;
            }
            const { name, phone, address } = req.body;
            const user = await User_1.default.findById(req.user._id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.USER_NOT_FOUND
                });
                return;
            }
            if (name)
                user.name = name;
            if (phone !== undefined)
                user.phone = phone;
            if (address !== undefined)
                user.address = address;
            await user.save();
            res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: user.getPublicProfile()
            });
        }
        catch (error) {
            console.error('Error en updateProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar perfil',
                error: error.message
            });
        }
    }
    static async changePassword(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.UNAUTHORIZED
                });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar contraseña actual y nueva'
                });
                return;
            }
            if (newPassword.length < 6) {
                res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 6 caracteres'
                });
                return;
            }
            const user = await User_1.default.findById(req.user._id).select('+password');
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.USER_NOT_FOUND
                });
                return;
            }
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: 'Contraseña actual incorrecta'
                });
                return;
            }
            user.password = newPassword;
            await user.save();
            res.status(200).json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
        }
        catch (error) {
            console.error('Error en changePassword:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cambiar contraseña',
                error: error.message
            });
        }
    }
    static async verifyToken(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.UNAUTHORIZED
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
        }
        catch (error) {
            console.error('Error en verifyToken:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar token',
                error: error.message
            });
        }
    }
    static async logout(_req, res) {
        try {
            res.status(200).json({
                success: true,
                message: 'Logout exitoso'
            });
        }
        catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión',
                error: error.message
            });
        }
    }
}
exports.default = AuthController;
//# sourceMappingURL=authController.js.map