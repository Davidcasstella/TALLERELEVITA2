import { Request, Response } from 'express';
import Category from '../models/Category';
import { AuthRequest } from './authController';
import { ERROR_MESSAGES } from '../types/enums';
import { ICategory } from '../types/interfaces';

/**
 * Controlador de Categorías
 */
class CategoryController {
  /**
   * @desc    Obtener todas las categorías
   * @route   GET /api/categories
   * @access  Public
   */
  static async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const { isActive, withProducts } = req.query;

      let categories: ICategory[];

      if (isActive === 'true') {
        categories = await Category.getActive();
      } else if (withProducts === 'true') {
        categories = await Category.getAllWithProductCount();
      } else {
        categories = await Category.find().sort({ sortOrder: 1, createdAt: -1 });
      }

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      console.error('Error en getAllCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener categorías',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener categoría por ID
   * @route   GET /api/categories/:id
   * @access  Public
   */
  static async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);

      if (!category) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.CATEGORY_NOT_FOUND
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error: any) {
      console.error('Error en getCategoryById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener categoría',
        error: error.message
      });
    }
  }

  /**
   * @desc    Crear nueva categoría
   * @route   POST /api/categories
   * @access  Private/Admin
   */
  static async createCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, description, icon, sortOrder } = req.body;

      // Validaciones
      if (!name) {
        res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio'
        });
        return;
      }

      // Verificar si el nombre ya existe
      const isUnique = await Category.isNameUnique(name);
      if (!isUnique) {
        res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre'
        });
        return;
      }

      const categoryData: Partial<ICategory> = {
        name,
        description,
        icon,
        sortOrder: sortOrder || 0
      };

      const category = await Category.create(categoryData);

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: category
      });
    } catch (error: any) {
      console.error('Error en createCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear categoría',
        error: error.message
      });
    }
  }

  /**
   * @desc    Actualizar categoría
   * @route   PUT /api/categories/:id
   * @access  Private/Admin
   */
  static async updateCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, icon, sortOrder, isActive } = req.body;

      const category = await Category.findById(id);

      if (!category) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.CATEGORY_NOT_FOUND
        });
        return;
      }

      // Verificar nombre único si se está cambiando
      if (name && name !== category.name) {
        const isUnique = await Category.isNameUnique(name, id);
        if (!isUnique) {
          res.status(400).json({
            success: false,
            message: 'Ya existe una categoría con ese nombre'
          });
          return;
        }
        category.name = name;
      }

      // Actualizar campos
      if (description !== undefined) category.description = description;
      if (icon !== undefined) category.icon = icon;
      if (sortOrder !== undefined) category.sortOrder = sortOrder;
      if (isActive !== undefined) category.isActive = isActive;

      await category.save();

      res.status(200).json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: category
      });
    } catch (error: any) {
      console.error('Error en updateCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar categoría',
        error: error.message
      });
    }
  }

  /**
   * @desc    Eliminar categoría (soft delete)
   * @route   DELETE /api/categories/:id
   * @access  Private/Admin
   */
  static async deleteCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar si tiene productos asociados
      const hasProducts = await Category.hasProducts(id);
      if (hasProducts) {
        res.status(400).json({
          success: false,
          message: 'No se puede eliminar una categoría con productos asociados'
        });
        return;
      }

      await Category.softDelete(id);

      res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente'
      });
    } catch (error: any) {
      console.error('Error en deleteCategory:', error);

      if (error.message === ERROR_MESSAGES.CATEGORY_NOT_FOUND) {
        res.status(404).json({
          success: false,
          message: ERROR_MESSAGES.CATEGORY_NOT_FOUND
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

  /**
   * @desc    Reordenar categorías
   * @route   PATCH /api/categories/reorder
   * @access  Private/Admin
   */
  static async reorderCategories(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { categoryIds } = req.body;

      if (!Array.isArray(categoryIds)) {
        res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs de categorías'
        });
        return;
      }

      await Category.reorder(categoryIds);

      res.status(200).json({
        success: true,
        message: 'Categorías reordenadas exitosamente'
      });
    } catch (error: any) {
      console.error('Error en reorderCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reordenar categorías',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener estadísticas de categorías
   * @route   GET /api/categories/stats
   * @access  Private/Admin
   */
  static async getCategoryStats(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await Category.getStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error en getCategoryStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
}

export default CategoryController;