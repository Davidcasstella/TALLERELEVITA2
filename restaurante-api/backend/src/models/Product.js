/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *         - preparationTime
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         ingredients:
 *           type: array
 *           items:
 *             type: string
 *         preparationTime:
 *           type: number
 *         image:
 *           type: string
 *         isVegetarian:
 *           type: boolean
 *         isVegan:
 *           type: boolean
 *         isGlutenFree:
 *           type: boolean
 *         spicyLevel:
 *           type: number
 *         isAvailable:
 *           type: boolean
 *         rating:
 *           type: number
 *         reviewCount:
 *           type: number
 *         popularity:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo'],
    max: [999999, 'El precio es demasiado alto']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
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
    min: [1, 'El tiempo mínimo es 1 minuto'],
    max: [180, 'El tiempo máximo es 180 minutos']
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
    default: 0
  },
  popularity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para búsquedas y rendimiento
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ popularity: -1 });

module.exports = mongoose.model('Product', productSchema);