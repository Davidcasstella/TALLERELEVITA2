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
 * Busca categoría por nombre (case insensitive)
 */
categorySchema.statics.findByName = async function(name: string) {
  return await this.findOne({ 
    name: { $regex: new RegExp(`^${name}$`, 'i') } 
  });
};

/**
 * Obtiene categorías activas ordenadas
 */
categorySchema.statics.getActive = async function() {
  return await this.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 });
};

/**
 * Obtiene todas las categorías con conteo de productos
 */
categorySchema.statics.getAllWithProductCount = async function() {
  return await this.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'category',
        as: 'products'
      }
    },
    {
      $addFields: {
        productCount: { $size: '$products' }
      }
    },
    {
      $project: {
        products: 0
      }
    },
    {
      $sort: { sortOrder: 1, createdAt: -1 }
    }
  ]);
};

/**
 * Verifica si una categoría tiene productos asociados
 */
categorySchema.statics.hasProducts = async function(categoryId: string) {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ category: categoryId });
  return count > 0;
};

/**
 * Valida que el nombre sea único
 */
categorySchema.statics.isNameUnique = async function(
  name: string, 
  excludeId?: string
) {
  const query: any = { 
    name: { $regex: new RegExp(`^${name}$`, 'i') } 
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existing = await this.findOne(query);
  return !existing;
};

/**
 * Soft delete: desactiva categoría
 */
categorySchema.statics.softDelete = async function(categoryId: string) {
  const category = await this.findById(categoryId);
  if (!category) {
    throw new Error(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
  }

  // Verificar si tiene productos usando el modelo Product directamente
  const Product = mongoose.model('Product');
  const productCount = await Product.countDocuments({ category: categoryId });
  
  if (productCount > 0) {
    throw new Error('No se puede eliminar una categoría con productos asociados');
  }

  category.isActive = false;
  await category.save();
};

/**
 * Reordena categorías
 */
categorySchema.statics.reorder = async function(categoryIds: string[]) {
  const updates = categoryIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { sortOrder: index }
    }
  }));

  await this.bulkWrite(updates);
};

/**
 * Obtiene estadísticas de categorías
 */
categorySchema.statics.getStats = async function() {
  const [total, active, withProducts] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ isActive: true }),
    this.aggregate([
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
    ]).then((result: any[]) => result[0]?.count || 0)
  ]);

  return {
    total,
    active,
    inactive: total - active,
    withProducts
  };
};

// ==================== INTERFAZ DEL MODELO ====================

interface ICategoryModel extends Model<ICategory> {
  findByName(name: string): Promise<ICategory | null>;
  getActive(): Promise<ICategory[]>;
  getAllWithProductCount(): Promise<any[]>;
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

// ==================== MODELO ====================

const Category = mongoose.model<ICategory, ICategoryModel>('Category', categorySchema);

export default Category;