import mongoose, { Schema, Model } from 'mongoose';
import { ICategory } from '../types/interfaces';
import { ERROR_MESSAGES } from '../types/enums';

/**
 * Schema de Mongoose para Categoría
 */
const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
      unique: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres'],
      default: undefined
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [10, 'El icono no puede exceder 10 caracteres'],
      default: undefined
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: [0, 'El orden no puede ser negativo']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDICES ====================

categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ isActive: 1 });

// ==================== VIRTUAL PROPERTIES ====================

/**
 * Virtual: Cuenta productos en esta categoría
 */
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// ==================== MÉTODOS ESTÁTICOS ====================

/**
 * Clase de servicio para operaciones de Categoría
 */
class CategoryService {
  /**
   * Busca categoría por nombre (case insensitive)
   */
  static async findByName(name: string): Promise<ICategory | null> {
    return await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
  }

  /**
   * Obtiene categorías activas ordenadas
   */
  static async getActive(): Promise<ICategory[]> {
    return await Category.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 });
  }

  /**
   * Obtiene todas las categorías con conteo de productos
   */
  static async getAllWithProductCount(): Promise<ICategory[]> {
    return await Category.find()
      .populate('productCount')
      .sort({ sortOrder: 1 });
  }

  /**
   * Verifica si una categoría tiene productos asociados
   */
  static async hasProducts(categoryId: string): Promise<boolean> {
    const Product = mongoose.model('Product');
    const count = await Product.countDocuments({ category: categoryId });
    return count > 0;
  }

  /**
   * Valida que el nombre sea único
   */
  static async isNameUnique(name: string, excludeId?: string): Promise<boolean> {
    const query: any = { name: { $regex: new RegExp(`^${name}$`, 'i') } };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await Category.findOne(query);
    return !existing;
  }

  /**
   * Soft delete: desactiva categoría
   */
  static async softDelete(categoryId: string): Promise<void> {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    // Verificar si tiene productos
    const hasProducts = await this.hasProducts(categoryId);
    if (hasProducts) {
      throw new Error('No se puede eliminar una categoría con productos asociados');
    }

    category.isActive = false;
    await category.save();
  }

  /**
   * Reordena categorías
   */
  static async reorder(categoryIds: string[]): Promise<void> {
    const updates = categoryIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { sortOrder: index }
      }
    }));

    await Category.bulkWrite(updates);
  }

  /**
   * Obtiene estadísticas de categorías
   */
  static async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withProducts: number;
  }> {
    const [total, active, withProducts] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Category.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'products'
          }
        },
        {
          $match: {
            'products.0': { $exists: true }
          }
        },
        { $count: 'count' }
      ]).then(result => result[0]?.count || 0)
    ]);

    return {
      total,
      active,
      inactive: total - active,
      withProducts
    };
  }
}

// Agregar métodos estáticos al schema
categorySchema.statics = Object.assign(categorySchema.statics, CategoryService);

// ==================== MODELO ====================

interface ICategoryModel extends Model<ICategory> {
  findByName(name: string): Promise<ICategory | null>;
  getActive(): Promise<ICategory[]>;
  getAllWithProductCount(): Promise<ICategory[]>;
  hasProducts(categoryId: string): Promise<boolean>;
  isNameUnique(name: string, excludeId?: string): Promise<boolean>;
  softDelete(categoryId: string): Promise<void>;
  reorder(categoryIds: string[]): Promise<void>;
  getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withProducts: number;
  }>;
}

const Category = mongoose.model<ICategory, ICategoryModel>('Category', categorySchema);

export default Category;