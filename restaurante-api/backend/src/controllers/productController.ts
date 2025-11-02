import { Request, Response } from 'express';
import Product from '../models/Product';
import { AuthRequest } from './authController';
import { IProduct } from '../types/interfaces';

/**
 * Controlador de Productos
 */
class ProductController {
  /**
   * @desc    Obtener todos los productos con filtros
   * @route   GET /api/products
   * @access  Public
   */
  static async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        available,
        search,
        minPrice,
        maxPrice,
        page = '1',
        limit = '10',
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      // ✅ CORREGIDO: Construir filtros manualmente
      const filters: any = {};

      if (category) {
        filters.category = category;
      }

      if (available !== undefined) {
        filters.isAvailable = available === 'true';
      }

      if (search) {
        filters.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.$gte = Number(minPrice);
        if (maxPrice) filters.price.$lte = Number(maxPrice);
      }

      // Paginación
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      // Ordenamiento
      const sort: any = {};
      sort[sortBy as string] = order === 'asc' ? 1 : -1;

      // Ejecutar query
      const [products, total] = await Promise.all([
        Product.find(filters)
          .sort(sort)
          .limit(limitNum)
          .skip(skip)
          .populate('category'),
        Product.countDocuments(filters)
      ]);

      res.status(200).json({
        success: true,
        data: products,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum),
          limit: limitNum
        }
      });
    } catch (error: any) {
      console.error('Error en getAllProducts:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener producto por ID
   * @route   GET /api/products/:id
   * @access  Public
   */
  static async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const product = await Product.findById(id).populate('category');

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error: any) {
      console.error('Error en getProductById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener producto',
        error: error.message
      });
    }
  }

  /**
   * @desc    Crear nuevo producto
   * @route   POST /api/products
   * @access  Private/Admin
   */
  static async createProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const productData: Partial<IProduct> = req.body;

      // Validaciones básicas
      if (!productData.name || !productData.price || !productData.category) {
        res.status(400).json({
          success: false,
          message: 'Nombre, precio y categoría son obligatorios'
        });
        return;
      }

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product
      });
    } catch (error: any) {
      console.error('Error en createProduct:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear producto',
        error: error.message
      });
    }
  }

  /**
   * @desc    Actualizar producto
   * @route   PUT /api/products/:id
   * @access  Private/Admin
   */
  static async updateProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: Partial<IProduct> = req.body;

      const product = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: product
      });
    } catch (error: any) {
      console.error('Error en updateProduct:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar producto',
        error: error.message
      });
    }
  }

  /**
   * @desc    Eliminar producto
   * @route   DELETE /api/products/:id
   * @access  Private/Admin
   */
  static async deleteProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });
    } catch (error: any) {
      console.error('Error en deleteProduct:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar producto',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener productos por categoría
   * @route   GET /api/products/category/:categoryId
   * @access  Public
   */
  static async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { categoryId } = req.params;

      const products = await Product.find({
        category: categoryId,
        isAvailable: true
      }).populate('category');

      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error: any) {
      console.error('Error en getProductsByCategory:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos por categoría',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener productos mejor valorados
   * @route   GET /api/products/top-rated
   * @access  Public
   */
  static async getTopRatedProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '10' } = req.query;

      const products = await Product.find({ isAvailable: true })
        .sort({ averageRating: -1 })
        .limit(Number(limit))
        .populate('category');

      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error: any) {
      console.error('Error en getTopRatedProducts:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos mejor valorados',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener productos más vendidos
   * @route   GET /api/products/best-sellers
   * @access  Public
   */
  static async getBestSellers(req: Request, res: Response): Promise<void> {
    try {
      const { limit = '10' } = req.query;

      const products = await Product.find({ isAvailable: true })
        .sort({ salesCount: -1 })
        .limit(Number(limit))
        .populate('category');

      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error: any) {
      console.error('Error en getBestSellers:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos más vendidos',
        error: error.message
      });
    }
  }

  /**
   * @desc    Buscar productos por preferencias dietéticas
   * @route   GET /api/products/dietary
   * @access  Public
   */
  static async getProductsByDietaryPreferences(req: Request, res: Response): Promise<void> {
    try {
      const { vegetarian, vegan, glutenFree } = req.query;

      const filters: any = { isAvailable: true };

      if (vegetarian === 'true') {
        filters['dietaryInfo.isVegetarian'] = true;
      }
      if (vegan === 'true') {
        filters['dietaryInfo.isVegan'] = true;
      }
      if (glutenFree === 'true') {
        filters['dietaryInfo.isGlutenFree'] = true;
      }

      const products = await Product.find(filters).populate('category');

      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error: any) {
      console.error('Error en getProductsByDietaryPreferences:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos por preferencias',
        error: error.message
      });
    }
  }

  /**
   * @desc    Actualizar disponibilidad en lote
   * @route   PATCH /api/products/bulk-availability
   * @access  Private/Admin
   */
  static async bulkUpdateAvailability(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productIds, isAvailable } = req.body;

      if (!Array.isArray(productIds) || typeof isAvailable !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Se requiere un array de IDs y un estado booleano'
        });
        return;
      }

      await Product.updateMany(
        { _id: { $in: productIds } },
        { isAvailable }
      );

      res.status(200).json({
        success: true,
        message: `Disponibilidad actualizada para ${productIds.length} productos`
      });
    } catch (error: any) {
      console.error('Error en bulkUpdateAvailability:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar disponibilidad',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener estadísticas de productos
   * @route   GET /api/products/stats
   * @access  Private/Admin
   */
  static async getProductStats(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const [total, available, unavailable, byCategory] = await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ isAvailable: true }),
        Product.countDocuments({ isAvailable: false }),
        Product.aggregate([
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      res.status(200).json({
        success: true,
        data: {
          total,
          available,
          unavailable,
          byCategory
        }
      });
    } catch (error: any) {
      console.error('Error en getProductStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
}

export default ProductController;