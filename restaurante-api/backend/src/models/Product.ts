import mongoose, { Schema, Model } from 'mongoose';
import { IProduct, IProductFilters } from '../types/interfaces';
import { CONSTANTS } from '../types/enums';

/**
 * Schema de Mongoose para Producto
 */
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [CONSTANTS.MAX_DESCRIPTION_LENGTH, `La descripción no puede exceder ${CONSTANTS.MAX_DESCRIPTION_LENGTH} caracteres`],
      default: undefined
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [CONSTANTS.MIN_PRICE, 'El precio no puede ser negativo'],
      max: [CONSTANTS.MAX_PRICE, 'El precio es demasiado alto']
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es obligatoria']
    },
    ingredients: [{
      type: String,
      trim: true,
      maxlength: [50, 'Un ingrediente no puede exceder 50 caracteres']
    }],
    preparationTime: {
      type: Number,
      required: [true, 'El tiempo de preparación es obligatorio'],
      min: [CONSTANTS.MIN_PREPARATION_TIME, `El tiempo mínimo es ${CONSTANTS.MIN_PREPARATION_TIME} minuto`],
      max: [CONSTANTS.MAX_PREPARATION_TIME, `El tiempo máximo es ${CONSTANTS.MAX_PREPARATION_TIME} minutos`]
    },
    image: {
      type: String,
      default: null
    },
    isVegetarian: {
      type: Boolean,
      default: false
    },
    isVegan: {
      type: Boolean,
      default: false
    },
    isGlutenFree: {
      type: Boolean,
      default: false
    },
    spicyLevel: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    popularity: {
      type: Number,
      default: 0,
      min: 0
    },
    nutritionalInfo: {
      calories: { type: Number, min: 0 },
      proteins: { type: Number, min: 0 },
      carbs: { type: Number, min: 0 },
      fats: { type: Number, min: 0 },
      fiber: { type: Number, min: 0 }
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

productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ popularity: -1 });
productSchema.index({ name: 'text', description: 'text' }); // Índice de texto para búsqueda

// ==================== VIRTUAL PROPERTIES ====================

/**
 * Virtual: Indica si es apto para veganos
 */
productSchema.virtual('isVeganFriendly').get(function(this: IProduct) {
  return this.isVegan || this.isVegetarian;
});

/**
 * Virtual: Descripción del nivel de picante
 */
productSchema.virtual('spicyDescription').get(function(this: IProduct) {
  const levels = ['Sin picante', 'Suave', 'Medio', 'Picante', 'Muy picante', 'Extremadamente picante'];
  return levels[this.spicyLevel] || 'Sin picante';
});

// ==================== MIDDLEWARE ====================

/**
 * Pre-save: Validación de lógica de negocio
 */
productSchema.pre<IProduct>('save', function(next) {
  // Si es vegano, debe ser vegetariano
  if (this.isVegan) {
    this.isVegetarian = true;
  }
  
  next();
});

/**
 * Pre-find: Popular categoría automáticamente
 */
productSchema.pre(/^find/, function(next) {
  (this as any).populate({
    path: 'category',
    select: 'name description icon'
  });
  next();
});

// ==================== MÉTODOS DE INSTANCIA ====================

/**
 * Incrementa popularidad del producto
 */
productSchema.methods.incrementPopularity = async function(this: IProduct): Promise<void> {
  this.popularity += 1;
  await this.save();
};

/**
 * Actualiza rating del producto
 */
productSchema.methods.updateRating = async function(
  this: IProduct,
  newRating: number
): Promise<void> {
  const totalRating = (this.rating * this.reviewCount) + newRating;
  this.reviewCount += 1;
  this.rating = totalRating / this.reviewCount;
  await this.save();
};

// ==================== MÉTODOS ESTÁTICOS ====================

/**
 * Clase de servicio para operaciones de Producto
 */
class ProductService {
  /**
   * Busca productos con filtros avanzados
   */
  static async findWithFilters(filters: IProductFilters): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    pages: number;
  }> {
    const {
      category,
      available,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = CONSTANTS.DEFAULT_PAGE_SIZE,
      sortBy = 'createdAt',
      order = 'desc'
    } = filters;

    // Construir query
    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (available !== undefined) {
      query.isAvailable = available;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    // Calcular paginación
    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    // Ejecutar queries
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    return {
      products,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Obtiene productos disponibles de una categoría
   */
  static async getAvailableByCategory(categoryId: string): Promise<IProduct[]> {
    return await Product.find({
      category: categoryId,
      isAvailable: true
    }).sort({ popularity: -1, rating: -1 });
  }

  /**
   * Obtiene productos más populares
   */
  static async getTopRated(limit: number = 10): Promise<IProduct[]> {
    return await Product.find({ isAvailable: true })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(limit);
  }

  /**
   * Obtiene productos más vendidos
   */
  static async getBestSellers(limit: number = 10): Promise<IProduct[]> {
    return await Product.find({ isAvailable: true })
      .sort({ popularity: -1 })
      .limit(limit);
  }

  /**
   * Busca productos por características dietéticas
   */
  static async findByDietaryPreferences(preferences: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
  }): Promise<IProduct[]> {
    const query: any = { isAvailable: true };

    if (preferences.vegan) {
      query.isVegan = true;
    } else if (preferences.vegetarian) {
      query.isVegetarian = true;
    }

    if (preferences.glutenFree) {
      query.isGlutenFree = true;
    }

    return await Product.find(query).sort({ rating: -1 });
  }

  /**
   * Actualiza disponibilidad en lote
   */
  static async bulkUpdateAvailability(
    productIds: string[],
    isAvailable: boolean
  ): Promise<void> {
    await Product.updateMany(
      { _id: { $in: productIds } },
      { isAvailable }
    );
  }

  /**
   * Obtiene estadísticas de productos
   */
  static async getStats(): Promise<{
    total: number;
    available: number;
    unavailable: number;
    vegetarian: number;
    vegan: number;
    glutenFree: number;
    averagePrice: number;
    averageRating: number;
  }> {
    const [stats, avgStats] = await Promise.all([
      Product.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            available: [{ $match: { isAvailable: true } }, { $count: 'count' }],
            unavailable: [{ $match: { isAvailable: false } }, { $count: 'count' }],
            vegetarian: [{ $match: { isVegetarian: true } }, { $count: 'count' }],
            vegan: [{ $match: { isVegan: true } }, { $count: 'count' }],
            glutenFree: [{ $match: { isGlutenFree: true } }, { $count: 'count' }]
          }
        }
      ]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            averagePrice: { $avg: '$price' },
            averageRating: { $avg: '$rating' }
          }
        }
      ])
    ]);

    const counts = stats[0];
    const averages = avgStats[0] || { averagePrice: 0, averageRating: 0 };

    return {
      total: counts.total[0]?.count || 0,
      available: counts.available[0]?.count || 0,
      unavailable: counts.unavailable[0]?.count || 0,
      vegetarian: counts.vegetarian[0]?.count || 0,
      vegan: counts.vegan[0]?.count || 0,
      glutenFree: counts.glutenFree[0]?.count || 0,
      averagePrice: Math.round(averages.averagePrice || 0),
      averageRating: Math.round((averages.averageRating || 0) * 100) / 100
    };
  }
}

// Agregar métodos estáticos al schema
productSchema.statics = Object.assign(productSchema.statics, ProductService);

// ==================== MODELO ====================

interface IProductModel extends Model<IProduct> {
  findWithFilters(filters: IProductFilters): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    pages: number;
  }>;
  getAvailableByCategory(categoryId: string): Promise<IProduct[]>;
  getTopRated(limit?: number): Promise<IProduct[]>;
  getBestSellers(limit?: number): Promise<IProduct[]>;
  findByDietaryPreferences(preferences: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
  }): Promise<IProduct[]>;
  bulkUpdateAvailability(productIds: string[], isAvailable: boolean): Promise<void>;
  getStats(): Promise<{
    total: number;
    available: number;
    unavailable: number;
    vegetarian: number;
    vegan: number;
    glutenFree: number;
    averagePrice: number;
    averageRating: number;
  }>;
}

const Product = mongoose.model<IProduct, IProductModel>('Product', productSchema);

export default Product;