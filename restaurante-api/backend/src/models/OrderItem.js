const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - product
 *         - quantity
 *         - unitPrice
 *       properties:
 *         product:
 *           type: string
 *           description: ID del producto
 *           example: "65f1234567890abcdef12345"
 *         quantity:
 *           type: number
 *           description: Cantidad del producto
 *           example: 2
 *         unitPrice:
 *           type: number
 *           description: Precio unitario al momento del pedido
 *           example: 25000
 *         specialInstructions:
 *           type: string
 *           description: Instrucciones especiales
 *           example: "Sin cebolla, extra queso"
 *         subtotal:
 *           type: number
 *           description: Subtotal del item (cantidad * precio)
 *           example: 50000
 */

const orderItemSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'La referencia al pedido es obligatoria']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'El producto es obligatorio']
  },
  // Información del producto al momento del pedido (snapshot)
  productSnapshot: {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio en el snapshot']
    },
    description: String,
    image: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }
  },
  quantity: {
    type: Number,
    required: [true, 'La cantidad es obligatoria'],
    min: [1, 'La cantidad debe ser al menos 1'],
    max: [50, 'La cantidad no puede exceder 50 unidades']
  },
  unitPrice: {
    type: Number,
    required: [true, 'El precio unitario es obligatorio'],
    min: [0, 'El precio unitario no puede ser negativo']
  },
  subtotal: {
    type: Number,
    required: [true, 'El subtotal es obligatorio'],
    min: [0, 'El subtotal no puede ser negativo']
  },
  // Personalizaciones y notas
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: [200, 'Las instrucciones especiales no pueden exceder 200 caracteres']
  },
  modifications: [{
    type: {
      type: String,
      enum: ['add', 'remove', 'extra', 'less', 'substitute'],
      required: true
    },
    item: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'El item de modificación no puede exceder 50 caracteres']
    },
    additionalCost: {
      type: Number,
      default: 0,
      min: [0, 'El costo adicional no puede ser negativo']
    }
  }],
  // Estado de preparación del item específico
  preparationStatus: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served'],
    default: 'pending'
  },
  preparationNotes: {
    type: String,
    trim: true,
    maxlength: [200, 'Las notas de preparación no pueden exceder 200 caracteres']
  },
  // Información del chef/cocinero
  assignedChef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(chefId) {
        if (!chefId) return true; // Es opcional
        
        const User = require('./User');
        const chef = await User.findById(chefId);
        return chef && chef.role === 'chef';
      },
      message: 'El chef asignado debe tener rol de chef'
    }
  },
  // Timestamps de preparación
  startedPreparingAt: Date,
  finishedPreparingAt: Date,
  servedAt: Date,
  // Descuentos aplicados al item específico
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    value: {
      type: Number,
      default: 0,
      min: [0, 'El descuento no puede ser negativo']
    },
    reason: {
      type: String,
      maxlength: [100, 'La razón del descuento no puede exceder 100 caracteres']
    }
  },
  // Rating específico del item (opcional)
  itemRating: {
    score: {
      type: Number,
      min: [1, 'La calificación mínima es 1'],
      max: [5, 'La calificación máxima es 5']
    },
    comment: {
      type: String,
      maxlength: [200, 'El comentario no puede exceder 200 caracteres']
    }
  },
  // Información nutricional total (cantidad * info nutricional del producto)
  totalNutritionalInfo: {
    calories: Number,
    proteins: Number,
    carbs: Number,
    fats: Number,
    fiber: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
orderItemSchema.index({ order: 1 });
orderItemSchema.index({ product: 1 });
orderItemSchema.index({ preparationStatus: 1 });
orderItemSchema.index({ assignedChef: 1 });

// Índice compuesto para consultas de cocina
orderItemSchema.index({ preparationStatus: 1, assignedChef: 1 });

// Populate automático del producto
orderItemSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'product',
    select: 'name description image category preparationTime isAvailable'
  }).populate({
    path: 'assignedChef',
    select: 'name employeeId'
  });
  next();
});

// Pre-save middleware simplificado - ya no calcula subtotal ni snapshot
// porque se proporcionan directamente en el controlador
orderItemSchema.pre('save', async function(next) {
  try {
    // Si no tiene subtotal calculado, calcularlo
    if (!this.subtotal) {
      this.subtotal = this.quantity * this.unitPrice;
    }
    
    // Agregar costo de modificaciones
    if (this.modifications && this.modifications.length > 0) {
      const additionalCost = this.modifications.reduce((total, mod) => {
        return total + (mod.additionalCost * this.quantity);
      }, 0);
      this.subtotal += additionalCost;
    }
    
    // Aplicar descuento si existe
    if (this.discount && this.discount.value > 0) {
      let discountAmount = 0;
      if (this.discount.type === 'percentage') {
        discountAmount = (this.subtotal * this.discount.value) / 100;
      } else {
        discountAmount = this.discount.value;
      }
      this.subtotal = Math.max(0, this.subtotal - discountAmount);
    }
    
    // Solo calcular información nutricional si no está presente y hay producto
    if (this.isNew && this.product && !this.totalNutritionalInfo) {
      const Product = mongoose.model('Product');
      const product = await Product.findById(this.product);
      
      if (product && product.nutritionalInfo) {
        this.totalNutritionalInfo = {
          calories: (product.nutritionalInfo.calories || 0) * this.quantity,
          proteins: (product.nutritionalInfo.proteins || 0) * this.quantity,
          carbs: (product.nutritionalInfo.carbs || 0) * this.quantity,
          fats: (product.nutritionalInfo.fats || 0) * this.quantity,
          fiber: (product.nutritionalInfo.fiber || 0) * this.quantity
        };
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual para tiempo de preparación real
orderItemSchema.virtual('preparationTime').get(function() {
  if (this.startedPreparingAt && this.finishedPreparingAt) {
    return Math.round((this.finishedPreparingAt - this.startedPreparingAt) / (1000 * 60));
  }
  return null;
});

// Virtual para verificar si está retrasado
orderItemSchema.virtual('isDelayed').get(function() {
  if (!this.startedPreparingAt || this.preparationStatus === 'ready' || this.preparationStatus === 'served') {
    return false;
  }
  
  // Asumir que debería estar listo en el tiempo de preparación del producto + 5 min buffer
  const expectedTime = new Date(this.startedPreparingAt.getTime() + ((this.product?.preparationTime || 15) + 5) * 60000);
  return new Date() > expectedTime;
});

// Virtual para mostrar modificaciones formateadas
orderItemSchema.virtual('modificationsText').get(function() {
  if (!this.modifications || this.modifications.length === 0) {
    return null;
  }
  
  return this.modifications.map(mod => {
    let text = '';
    switch (mod.type) {
      case 'add':
        text = `Agregar ${mod.item}`;
        break;
      case 'remove':
        text = `Sin ${mod.item}`;
        break;
      case 'extra':
        text = `Extra ${mod.item}`;
        break;
      case 'less':
        text = `Poco ${mod.item}`;
        break;
      case 'substitute':
        text = `Sustituir por ${mod.item}`;
        break;
    }
    
    if (mod.additionalCost > 0) {
      text += ` (+${mod.additionalCost})`;
    }
    
    return text;
  }).join(', ');
});

// Método para cambiar estado de preparación
orderItemSchema.methods.updatePreparationStatus = function(newStatus, chefId = null) {
  const previousStatus = this.preparationStatus;
  this.preparationStatus = newStatus;
  
  const now = new Date();
  
  switch (newStatus) {
    case 'preparing':
      this.startedPreparingAt = now;
      if (chefId) this.assignedChef = chefId;
      break;
    case 'ready':
      this.finishedPreparingAt = now;
      break;
    case 'served':
      this.servedAt = now;
      break;
  }
  
  return this.save();
};

// Método estático para obtener items por chef
orderItemSchema.statics.findByChef = function(chefId, status = null) {
  const query = { assignedChef: chefId };
  if (status) {
    query.preparationStatus = status;
  }
  
  return this.find(query)
    .populate('order', 'orderNumber tableNumber status')
    .sort({ createdAt: 1 });
};

// Método estático para obtener items pendientes de cocina
orderItemSchema.statics.getPendingForKitchen = function() {
  return this.find({
    preparationStatus: { $in: ['pending', 'preparing'] }
  })
  .populate('order', 'orderNumber tableNumber status estimatedPreparationTime')
  .populate('product', 'name preparationTime')
  .sort({ 'order.orderDate': 1, createdAt: 1 });
};

// Método estático para obtener estadísticas de un producto
orderItemSchema.statics.getProductStats = async function(productId, startDate, endDate) {
  const matchQuery = {
    product: mongoose.Types.ObjectId(productId)
  };
  
  if (startDate && endDate) {
    matchQuery.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalOrdered: { $sum: '$quantity' },
        totalRevenue: { $sum: '$subtotal' },
        averageQuantityPerOrder: { $avg: '$quantity' },
        averagePrice: { $avg: '$unitPrice' },
        ordersCount: { $sum: 1 }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrdered: 0,
    totalRevenue: 0,
    averageQuantityPerOrder: 0,
    averagePrice: 0,
    ordersCount: 0
  };
};

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

module.exports = OrderItem;