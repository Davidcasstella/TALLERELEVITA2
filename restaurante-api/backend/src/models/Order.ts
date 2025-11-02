import mongoose, { Schema, Model } from 'mongoose';
import { IOrder, IDeliveryInfo, IOrderRating, IOrderStats } from '../types/interfaces';
import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from '../types/enums';

/**
 * Sub-schema para información de delivery
 */
const deliveryInfoSchema = new Schema<IDeliveryInfo>({
  address: String,
  phone: String,
  instructions: String,
  estimatedTime: Date
}, { _id: false });

/**
 * Sub-schema para rating del pedido
 */
const orderRatingSchema = new Schema<IOrderRating>({
  score: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  ratedAt: Date
}, { _id: false });

/**
 * Schema principal de Order
 */
const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El cliente es obligatorio']
    },
    waiter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      validate: {
        validator: async function(waiterId: mongoose.Types.ObjectId) {
          if (!waiterId) return true;
          const User = mongoose.model('User');
          const waiter = await User.findById(waiterId);
          return waiter && (waiter as any).role === UserRole.WAITER;
        },
        message: 'El mesero asignado debe tener rol de waiter'
      }
    },
    items: [{
      type: Schema.Types.ObjectId,
      ref: 'OrderItem'
    }],
    status: {
      type: String,
      enum: {
        values: Object.values(OrderStatus),
        message: 'Estado inválido'
      },
      default: OrderStatus.PENDING
    },
    tableNumber: {
      type: Number,
      required: [true, 'El número de mesa es obligatorio'],
      min: [1, 'El número de mesa debe ser mayor a 0'],
      max: [100, 'Número de mesa inválido']
    },
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
    paymentMethod: {
      type: String,
      enum: {
        values: Object.values(PaymentMethod),
        message: 'Método de pago inválido'
      },
      default: PaymentMethod.PENDING
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING
    },
    transactionId: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    customerNotes: {
      type: String,
      trim: true,
      maxlength: 300
    },
    kitchenNotes: {
      type: String,
      trim: true,
      maxlength: 300
    },
    deliveryInfo: deliveryInfoSchema,
    orderDate: {
      type: Date,
      default: Date.now
    },
    confirmedAt: Date,
    preparedAt: Date,
    readyAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    estimatedPreparationTime: Number,
    actualPreparationTime: Number,
    rating: orderRatingSchema
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDICES ====================

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ waiter: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ tableNumber: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ status: 1, orderDate: -1 });
orderSchema.index({ customer: 1, orderDate: -1 });

// ==================== VIRTUALS ====================

/**
 * Virtual: Tiempo de preparación real
 */
orderSchema.virtual('preparationTimeActual').get(function(this: IOrder) {
  if (this.confirmedAt && this.readyAt) {
    return Math.round((this.readyAt.getTime() - this.confirmedAt.getTime()) / (1000 * 60));
  }
  return null;
});

/**
 * Virtual: Indica si está retrasado
 */
orderSchema.virtual('isDelayed').get(function(this: IOrder) {
  if (!this.estimatedPreparationTime || !this.confirmedAt || this.status === OrderStatus.DELIVERED) {
    return false;
  }
  
  const expectedTime = new Date(this.confirmedAt.getTime() + (this.estimatedPreparationTime * 60000));
  return new Date() > expectedTime && [OrderStatus.PREPARING, OrderStatus.READY].includes(this.status);
});

/**
 * Virtual: Tiempo restante estimado
 */
orderSchema.virtual('remainingTime').get(function(this: IOrder) {
  if (!this.estimatedPreparationTime || 
      !this.confirmedAt || 
      [OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(this.status)) {
    return null;
  }
  
  const expectedTime = new Date(this.confirmedAt.getTime() + (this.estimatedPreparationTime * 60000));
  const remaining = Math.round((expectedTime.getTime() - new Date().getTime()) / (1000 * 60));
  return Math.max(0, remaining);
});

// ==================== MIDDLEWARE ====================

/**
 * Pre-save: Generar número de orden
 */
orderSchema.pre<IOrder>('save', async function(next) {
  if (this.isNew) {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      const Order = mongoose.model<IOrder>('Order');
      const lastOrder = await Order.findOne({
        orderNumber: new RegExp(`^ORD-${dateStr}-`)
      }).sort({ orderNumber: -1 });
      
      let sequence = 1;
      if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      this.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(3, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

/**
 * Pre-find: Popular relaciones automáticamente
 */
orderSchema.pre(/^find/, function(next) {
  (this as any).populate({
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

// ==================== MÉTODOS DE INSTANCIA ====================

/**
 * Actualiza el estado del pedido
 */
orderSchema.methods.updateStatus = async function(
  this: IOrder,
  newStatus: OrderStatus,
  userId?: string
): Promise<IOrder> {
  this.status = newStatus;
  
  const now = new Date();
  
  switch (newStatus) {
    case OrderStatus.CONFIRMED:
      this.confirmedAt = now;
      if (userId) {
        const User = mongoose.model('User');
        const user = await User.findById(userId);
        if (user && (user as any).role === UserRole.WAITER) {
          this.waiter = new mongoose.Types.ObjectId(userId) as any;
        }
      }
      break;
    case OrderStatus.PREPARING:
      if (!this.confirmedAt) this.confirmedAt = now;
      break;
    case OrderStatus.READY:
      this.readyAt = now;
      if (this.confirmedAt) {
        this.actualPreparationTime = Math.round((now.getTime() - this.confirmedAt.getTime()) / (1000 * 60));
      }
      break;
    case OrderStatus.DELIVERED:
      this.deliveredAt = now;
      this.paymentStatus = this.paymentStatus === PaymentStatus.PENDING ? PaymentStatus.PAID : this.paymentStatus;
      break;
    case OrderStatus.CANCELLED:
      this.cancelledAt = now;
      this.paymentStatus = PaymentStatus.REFUNDED;
      break;
  }
  
  return await this.save();
};

/**
 * Calcula tiempo estimado basado en los items
 */
orderSchema.methods.calculateEstimatedTime = async function(this: IOrder): Promise<IOrder> {
  await this.populate('items');
  
  let maxTime = 0;
  const items = this.items as any[];
  
  for (const item of items) {
    await item.populate('product');
    if (item.product && item.product.preparationTime) {
      maxTime = Math.max(maxTime, item.product.preparationTime);
    }
  }
  
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  if (itemsCount > 5) {
    maxTime += Math.ceil((itemsCount - 5) * 2);
  }
  
  this.estimatedPreparationTime = Math.max(maxTime, 10);
  return await this.save();
};

// ==================== MÉTODOS ESTÁTICOS ====================

class OrderService {
  /**
   * Obtiene estadísticas del día
   */
  static async getTodayStats(): Promise<IOrderStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const stats = await Order.aggregate([
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
              $cond: [{ $ne: ['$status', OrderStatus.CANCELLED] }, '$totalAmount', 0] 
            }
          },
          averageOrderValue: { $avg: '$totalAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.PENDING] }, 1, 0] }
          },
          preparingOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.PREPARING] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.DELIVERED] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', OrderStatus.CANCELLED] }, 1, 0] }
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
  }
}

orderSchema.statics = Object.assign(orderSchema.statics, OrderService);

// ==================== MODELO ====================

interface IOrderModel extends Model<IOrder> {
  getTodayStats(): Promise<IOrderStats>;
}

const Order = mongoose.model<IOrder, IOrderModel>('Order', orderSchema);

export default Order;