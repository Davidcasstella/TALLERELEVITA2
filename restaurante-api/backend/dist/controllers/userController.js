"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const enums_1 = require("../types/enums");
class UserController {
    static async getAllUsers(req, res) {
        try {
            const { role, isActive, page = 1, limit = 10 } = req.query;
            const query = {};
            if (role) {
                query.role = role;
            }
            if (isActive !== undefined) {
                query.isActive = isActive === 'true';
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [users, total] = await Promise.all([
                User_1.default.find(query)
                    .select('-password')
                    .skip(skip)
                    .limit(Number(limit))
                    .sort({ createdAt: -1 }),
                User_1.default.countDocuments(query)
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
        }
        catch (error) {
            console.error('Error en getAllUsers:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios',
                error: error.message
            });
        }
    }
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await User_1.default.findById(id).select('-password');
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.USER_NOT_FOUND
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: user
            });
        }
        catch (error) {
            console.error('Error en getUserById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuario',
                error: error.message
            });
        }
    }
    static async createUser(req, res) {
        try {
            const { name, email, password, phone, address, role } = req.body;
            if (!name || !email || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Nombre, email y contraseña son obligatorios'
                });
                return;
            }
            const passwordValidation = User_1.default.validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                res.status(400).json({
                    success: false,
                    message: 'La contraseña no cumple con los requisitos',
                    errors: passwordValidation.errors
                });
                return;
            }
            const existingUser = await User_1.default.findByEmail(email);
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
            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente',
                data: user.getPublicProfile()
            });
        }
        catch (error) {
            console.error('Error en createUser:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear usuario',
                error: error.message
            });
        }
    }
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { name, email, phone, address, role, isActive } = req.body;
            const user = await User_1.default.findById(id);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.USER_NOT_FOUND
                });
                return;
            }
            if (name)
                user.name = name;
            if (email && email !== user.email) {
                const emailExists = await User_1.default.findByEmail(email);
                if (emailExists) {
                    res.status(400).json({
                        success: false,
                        message: 'El email ya está en uso'
                    });
                    return;
                }
                user.email = email;
            }
            if (phone !== undefined)
                user.phone = phone;
            if (address !== undefined)
                user.address = address;
            if (role)
                user.role = role;
            if (isActive !== undefined)
                user.isActive = isActive;
            await user.save();
            res.status(200).json({
                success: true,
                message: 'Usuario actualizado exitosamente',
                data: user.getPublicProfile()
            });
        }
        catch (error) {
            console.error('Error en updateUser:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar usuario',
                error: error.message
            });
        }
    }
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            if (req.user && req.user._id.toString() === id) {
                res.status(400).json({
                    success: false,
                    message: 'No puedes eliminar tu propia cuenta'
                });
                return;
            }
            await User_1.default.softDelete(id);
            res.status(200).json({
                success: true,
                message: 'Usuario eliminado exitosamente'
            });
        }
        catch (error) {
            console.error('Error en deleteUser:', error);
            if (error.message === enums_1.ERROR_MESSAGES.USER_NOT_FOUND) {
                res.status(404).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.USER_NOT_FOUND
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
    static async getUserStats(_req, res) {
        try {
            const countByRole = await User_1.default.countByRole();
            const totalUsers = await User_1.default.countDocuments({ isActive: true });
            const inactiveUsers = await User_1.default.countDocuments({ isActive: false });
            res.status(200).json({
                success: true,
                data: {
                    total: totalUsers,
                    inactive: inactiveUsers,
                    byRole: countByRole
                }
            });
        }
        catch (error) {
            console.error('Error en getUserStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    }
}
exports.default = UserController;
//# sourceMappingURL=userController.js.map