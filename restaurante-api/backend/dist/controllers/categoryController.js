"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Category_1 = __importDefault(require("../models/Category"));
const enums_1 = require("../types/enums");
class CategoryController {
    static async getAllCategories(req, res) {
        try {
            const { isActive, withProducts } = req.query;
            let categories;
            if (isActive === 'true') {
                categories = await Category_1.default.getActive();
            }
            else if (withProducts === 'true') {
                categories = await Category_1.default.getAllWithProductCount();
            }
            else {
                categories = await Category_1.default.find().sort({ sortOrder: 1, createdAt: -1 });
            }
            res.status(200).json({
                success: true,
                data: categories
            });
        }
        catch (error) {
            console.error('Error en getAllCategories:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener categorías',
                error: error.message
            });
        }
    }
    static async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const category = await Category_1.default.findById(id);
            if (!category) {
                res.status(404).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.CATEGORY_NOT_FOUND
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: category
            });
        }
        catch (error) {
            console.error('Error en getCategoryById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener categoría',
                error: error.message
            });
        }
    }
    static async createCategory(req, res) {
        try {
            const { name, description, icon, sortOrder } = req.body;
            if (!name) {
                res.status(400).json({
                    success: false,
                    message: 'El nombre es obligatorio'
                });
                return;
            }
            const isUnique = await Category_1.default.isNameUnique(name);
            if (!isUnique) {
                res.status(400).json({
                    success: false,
                    message: 'Ya existe una categoría con ese nombre'
                });
                return;
            }
            const categoryData = {
                name,
                description,
                icon,
                sortOrder: sortOrder || 0
            };
            const category = await Category_1.default.create(categoryData);
            res.status(201).json({
                success: true,
                message: 'Categoría creada exitosamente',
                data: category
            });
        }
        catch (error) {
            console.error('Error en createCategory:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear categoría',
                error: error.message
            });
        }
    }
    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { name, description, icon, sortOrder, isActive } = req.body;
            const category = await Category_1.default.findById(id);
            if (!category) {
                res.status(404).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.CATEGORY_NOT_FOUND
                });
                return;
            }
            if (name && name !== category.name) {
                const isUnique = await Category_1.default.isNameUnique(name, id);
                if (!isUnique) {
                    res.status(400).json({
                        success: false,
                        message: 'Ya existe una categoría con ese nombre'
                    });
                    return;
                }
                category.name = name;
            }
            if (description !== undefined)
                category.description = description;
            if (icon !== undefined)
                category.icon = icon;
            if (sortOrder !== undefined)
                category.sortOrder = sortOrder;
            if (isActive !== undefined)
                category.isActive = isActive;
            await category.save();
            res.status(200).json({
                success: true,
                message: 'Categoría actualizada exitosamente',
                data: category
            });
        }
        catch (error) {
            console.error('Error en updateCategory:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar categoría',
                error: error.message
            });
        }
    }
    static async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            const hasProducts = await Category_1.default.hasProducts(id);
            if (hasProducts) {
                res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar una categoría con productos asociados'
                });
                return;
            }
            await Category_1.default.softDelete(id);
            res.status(200).json({
                success: true,
                message: 'Categoría eliminada exitosamente'
            });
        }
        catch (error) {
            console.error('Error en deleteCategory:', error);
            if (error.message === enums_1.ERROR_MESSAGES.CATEGORY_NOT_FOUND) {
                res.status(404).json({
                    success: false,
                    message: enums_1.ERROR_MESSAGES.CATEGORY_NOT_FOUND
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Error al eliminar categoría',
                error: error.message
            });
        }
    }
    static async reorderCategories(req, res) {
        try {
            const { categoryIds } = req.body;
            if (!Array.isArray(categoryIds)) {
                res.status(400).json({
                    success: false,
                    message: 'Se requiere un array de IDs de categorías'
                });
                return;
            }
            await Category_1.default.reorder(categoryIds);
            res.status(200).json({
                success: true,
                message: 'Categorías reordenadas exitosamente'
            });
        }
        catch (error) {
            console.error('Error en reorderCategories:', error);
            res.status(500).json({
                success: false,
                message: 'Error al reordenar categorías',
                error: error.message
            });
        }
    }
    static async getCategoryStats(_req, res) {
        try {
            const stats = await Category_1.default.getStats();
            res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error en getCategoryStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    }
}
exports.default = CategoryController;
//# sourceMappingURL=categoryController.js.map