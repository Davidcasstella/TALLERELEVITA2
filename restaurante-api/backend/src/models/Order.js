const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderCreate:
 *       type: object
 *       required:
 *         - items
 *         - tableNumber
 *       properties:
 *         items:
 *           type: array
 *           description: Items del pedido
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: ID del producto
 *               quantity:
 *                 type: number
 *                 description: Cantidad
 *               specialInstructions:
 *                 type: string
 *                 description: Instrucciones especiales
 *           example:
 *             - product: "65f1234567890abcdef12345"
 *               quantity: 2
 *               specialInstructions: "Sin cebolla"
 *         tableNumber:
 *           type: number
 *           description: Número de mesa
 *           example: 5
 *         notes:
 *           type: string
 *           description: Notas del pedido
 *           example: "Cliente con alergia a los mariscos"
 *         paymentMethod:
 *           type: string
 *           enum: [cash, card, transfer]
 *           description: Método de pago
 *           example: "card"
 */

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El cliente es obligatorio']
  },
  waiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    validate: {
      validator: async function(waiterId) {
        if (!waiterId) return true; // Es opcional
        
        const User = mongoose.model('User');
        const waiter = await User.findById(waiterId);
        return waiter && waiter.role === 'waiter';
      },
      message: 'El mesero asignado debe tener rol de waiter'
    }
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderItem'
  }],
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      message: 'Estado inválido'
    },
    default: 'pending'
  },
  tableNumber: {
    type: Number,
    required: [true, 'El número de mesa es obligatorio'],
    min: [1, 'El número de mesa debe ser mayor a 0'],
    max: [100, 'Número de mesa inválido']
  },
  // Información de precios
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'El subtotal no puede ser negativo']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'El impuesto no puede ser negativo']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'El descuento no puede ser negativo']
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'El costo de envío no puede ser negativo']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'El total no puede ser negativo']
  },
  // Información de pago
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'card', 'transfer', 'pending'],
      message: 'Método de pago inválido'
    },
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  },
  // Notas y comentarios
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },
  customerNotes: {
    type: String,
    trim: true,
    maxlength: [300, 'Las notas del cliente no pueden exceder 300 caracteres']
  },
  kitchenNotes: {
    type: String,
    trim: true,
    maxlength: [300, 'Las notas de cocina no pueden exceder 300 caracteres']
  },
  // Información de delivery (si aplica)
  deliveryInfo: {
    address: String,
    phone: String,
    instructions: String,
    estimatedTime: Date
  },
  // Timestamps importantes
  orderDate: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  preparedAt: Date,
  readyAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  // Tiempo estimado de preparación
  estimatedPreparationTime: {
    type: Number, // en minutos
    default: null
  },
  actualPreparationTime: {
    type: Number, // en minutos calculado automáticamente
    default: null
  },
  // Rating del pedido (después de entregado)
  rating: {
    score: {
      type: Number,
      min: [1, 'La calificación mínima es 1'],
      max: [5, 'La calificación máxima es 5']
    },
    comment: {
      type: String,
      maxlength: [500, 'El comentario no puede exceder 500 caracteres']
    },
    ratedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ waiter: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ tableNumber: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ paymentStatus: 1 });

// Índice compuesto para consultas frecuentes
orderSchema.index({ status: 1, orderDate: -1 });
orderSchema.index({ customer: 1, orderDate: -1 });

// Pre-save middleware para generar número de orden
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Buscar el último pedido del día
      const lastOrder = await this.constructor
        .findOne({
          orderNumber: new RegExp(`^ORD-${dateStr}-`)
        })
        .sort({ orderNumber: -1 });
      
      let sequence = 1;
      if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      this.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(3, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Populate automático de relaciones
orderSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'customer',
    select: 'name email phone'
  }).populate({
    path: 'waiter',
    select: 'name employeeId'
  }).populate({
    path: 'items'
  });
  next();
});

// Virtual para calcular tiempo de preparación real
orderSchema.virtual('preparationTimeActual').get(function() {
  if (this.confirmedAt && this.readyAt) {
    return Math.round((this.readyAt - this.confirmedAt) / (1000 * 60)); // en minutos
  }
  return null;
});

// Virtual para verificar si está retrasado
orderSchema.virtual('isDelayed').get(function() {
  if (!this.estimatedPreparationTime || !this.confirmedAt || this.status === 'delivered') {
    return false;
  }
  
  const expectedTime = new Date(this.confirmedAt.getTime() + (this.estimatedPreparationTime * 60000));
  return new Date() > expectedTime && ['preparing', 'ready'].includes(this.status);
});

// Virtual para tiempo restante estimado
orderSchema.virtual('remainingTime').get(function() {
  if (!this.estimatedPreparationTime || !this.confirmedAt || ['delivered', 'cancelled'].includes(this.status)) {
    return null;
  }
  
  const expectedTime = new Date(this.confirmedAt.getTime() + (this.estimatedPreparationTime * 60000));
  const remaining = Math.round((expectedTime - new Date()) / (1000 * 60));
  return Math.max(0, remaining);
});

// Reemplaza el método updateStatus en tu modelo Order.js con este:
orderSchema.methods.updateStatus = function(newStatus, userId = null) {
  const previousStatus = this.status;
  this.status = newStatus;
  
  const now = new Date();
  
  switch (newStatus) {
    case 'confirmed':
      this.confirmedAt = now;
      // Solo asignar waiter si el usuario tiene rol de waiter
      if (userId) {
        // Verificar que el usuario tenga rol de waiter antes de asignar
        const User = require('./User');
        User.findById(userId).then(user => {
          if (user && user.role === 'waiter') {
            this.waiter = userId;
          }
          // Si es admin u otro rol, no asignar waiter
        });
      }
      break;
    case 'preparing':
      if (!this.confirmedAt) this.confirmedAt = now;
      break;
    case 'ready':
      this.readyAt = now;
      if (this.confirmedAt) {
        this.actualPreparationTime = Math.round((now - this.confirmedAt) / (1000 * 60));
      }
      break;
    case 'delivered':
      this.deliveredAt = now;
      this.paymentStatus = this.paymentStatus === 'pending' ? 'paid' : this.paymentStatus;
      break;
    case 'cancelled':
      this.cancelledAt = now;
      this.paymentStatus = 'refunded';
      break;
  }
  
  return this.save();
};
// Método para calcular tiempos estimados basado en los items
orderSchema.methods.calculateEstimatedTime = async function() {
  await this.populate('items');
  
  let maxTime = 0;
  for (const item of this.items) {
    await item.populate('product');
    if (item.product && item.product.preparationTime) {
      maxTime = Math.max(maxTime, item.product.preparationTime);
    }
  }
  
  // Agregar tiempo extra si hay muchos items
  const itemsCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
  if (itemsCount > 5) {
    maxTime += Math.ceil((itemsCount - 5) * 2); // 2 min extra por item adicional
  }
  
  this.estimatedPreparationTime = Math.max(maxTime, 10); // mínimo 10 minutos
  return this.save();
};

// Método estático para obtener estadísticas del día
orderSchema.statics.getTodayStats = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const stats = await this.aggregate([
    {
      $match: {
        orderDate: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { 
          $sum: { 
            $cond: [{ $ne: ['$status', 'cancelled'] }, '$totalAmount', 0] 
          }
        },
        averageOrderValue: { $avg: '$totalAmount' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        preparingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'preparing'] }, 1, 0] }
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  };
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;