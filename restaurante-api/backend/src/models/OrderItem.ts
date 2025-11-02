import mongoose, { Schema, Model } from 'mongoose';
import { IOrderItem, IModification, IItemDiscount, IItemRating } from '../types/interfaces';
import { PreparationStatus, ModificationType, DiscountType } from '../types/enums';

/**
 * Sub-schema para modificaciones
 */
const modificationSchema = new Schema<IModification>({
  type: {
    type: String,
    enum: Object.values(ModificationType),
    required: true
  },
  item: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  additionalCost: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

/**
 * Sub-schema para descuento de item
 */
const itemDiscountSchema = new Schema<IItemDiscount>({
  type: {
    type: String,
    enum: Object.values(DiscountType),
    default: DiscountType.PERCENTAGE
  },
  value: {
    type: Number,
    default: 0,
    min: 0
  },
  reason: {
    type: String,
    maxlength: 100
  }
}, { _id: false });

/**
 * Sub-schema para rating de item
 */
const itemRatingSchema = new Schema<IItemRating>({
  score: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 200
  }
}, { _id: false });

/**
 * Schema principal de OrderItem
 */
const orderItemSchema = new Schema<IOrderItem>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'La referencia al pedido es obligatoria']
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El producto es obligatorio']
    },
    productSnapshot: {
      name: {
        type: String,
        required: true
      },
      description: String,
      image: String,
      category: {
        type: Schema.Types.ObjectId,
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
      min: [0, 'El precio no puede ser negativo']
    },
    subtotal: {
      type: Number,
      required: [true, 'El subtotal es obligatorio'],
      min: [0, 'El subtotal no puede ser negativo']
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 200
    },
    modifications: [modificationSchema],
    preparationStatus: {
      type: String,
      enum: Object.values(PreparationStatus),
      default: PreparationStatus.PENDING
    },
    preparationNotes: {
      type: String,
      trim: true,
      maxlength: 200
    },
    assignedChef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: async function(chefId: mongoose.Types.ObjectId) {
          if (!chefId) return true;
          const User = mongoose.model('User');
          const chef = await User.findById(chefId);
          return chef && (chef as any).role === 'chef';
        },
        message: 'El chef asignado debe tener rol de chef'
      }
    },
    startedPreparingAt: Date,
    finishedPreparingAt: Date,
    servedAt: Date,
    discount: itemDiscountSchema,
    itemRating: itemRatingSchema,
    totalNutritionalInfo: {
      calories: Number,
      proteins: Number,
      carbs: Number,
      fats: Number,
      fiber: Number
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDICES ====================

orderItemSchema.index({ order: 1 });
orderItemSchema.index({ product: 1 });
orderItemSchema.index({ preparationStatus: 1 });
orderItemSchema.index({ assignedChef: 1 });
orderItemSchema.index({ preparationStatus: 1, assignedChef: 1 });

// ==================== VIRTUALS ====================

/**
 * Virtual: Tiempo real de preparación
 */
orderItemSchema.virtual('preparationTime').get(function(this: IOrderItem) {
  if (this.startedPreparingAt && this.finishedPreparingAt) {
    return Math.round((this.finishedPreparingAt.getTime() - this.startedPreparingAt.getTime()) / (1000 * 60));
  }
  return null;
});

/**
 * Virtual: Indica si está retrasado
 */
orderItemSchema.virtual('isDelayed').get(function(this: IOrderItem) {
  if (!this.startedPreparingAt || 
      this.preparationStatus === PreparationStatus.READY || 
      this.preparationStatus === PreparationStatus.SERVED) {
    return false;
  }
  
  const product = this.product as any;
  const preparationTime = product?.preparationTime || 15;
  const expectedTime = new Date(this.startedPreparingAt.getTime() + ((preparationTime + 5) * 60000));
  return new Date() > expectedTime;
});

/**
 * Virtual: Texto de modificaciones formateado
 */
orderItemSchema.virtual('modificationsText').get(function(this: IOrderItem) {
  if (!this.modifications || this.modifications.length === 0) {
    return null;
  }
  
  return this.modifications.map(mod => {
    let text = '';
    switch (mod.type) {
      case ModificationType.ADD:
        text = `Agregar ${mod.item}`;
        break;
      case ModificationType.REMOVE:
        text = `Sin ${mod.item}`;
        break;
      case ModificationType.EXTRA:
        text = `Extra ${mod.item}`;
        break;
      case ModificationType.LESS:
        text = `Poco ${mod.item}`;
        break;
      case ModificationType.SUBSTITUTE:
        text = `Sustituir por ${mod.item}`;
        break;
    }
    
    if (mod.additionalCost > 0) {
      text += ` (+$${mod.additionalCost})`;
    }
    
    return text;
  }).join(', ');
});

// ==================== MIDDLEWARE ====================

/**
 * Pre-save: Calcular subtotal y aplicar modificaciones
 */
orderItemSchema.pre<IOrderItem>('save', async function(next) {
  try {
    // Calcular subtotal base
    if (!this.subtotal || this.isModified('quantity') || this.isModified('unitPrice')) {
      this.subtotal = this.quantity * this.unitPrice;
    }
    
    // Agregar costo de modificaciones
    if (this.modifications && this.modifications.length > 0) {
      const additionalCost = this.modifications.reduce((total, mod) => {
        return total + (mod.additionalCost * this.quantity);
      }, 0);
      this.subtotal += additionalCost;
    }
    
    // Aplicar descuento
    if (this.discount && this.discount.value > 0) {
      let discountAmount = 0;
      if (this.discount.type === DiscountType.PERCENTAGE) {
        discountAmount = (this.subtotal * this.discount.value) / 100;
      } else {
        discountAmount = this.discount.value;
      }
      this.subtotal = Math.max(0, this.subtotal - discountAmount);
    }
    
    // Calcular información nutricional
    if (this.isNew && this.product && !this.totalNutritionalInfo) {
      const Product = mongoose.model('Product');
      const product = await Product.findById(this.product);
      
      if (product && (product as any).nutritionalInfo) {
        const nutInfo = (product as any).nutritionalInfo;
        this.totalNutritionalInfo = {
          calories: (nutInfo.calories || 0) * this.quantity,
          proteins: (nutInfo.proteins || 0) * this.quantity,
          carbs: (nutInfo.carbs || 0) * this.quantity,
          fats: (nutInfo.fats || 0) * this.quantity,
          fiber: (nutInfo.fiber || 0) * this.quantity
        };
      }
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Pre-find: Popular referencias
 */
orderItemSchema.pre(/^find/, function(next) {
  const query = this as any;
  query.populate([
    {
      path: 'product',
      select: 'name description image category preparationTime isAvailable'
    },
    {
      path: 'assignedChef',
      select: 'name employeeId'
    }
  ]);
  next();
});

// ==================== MÉTODOS DE INSTANCIA ====================

/**
 * Actualiza el estado de preparación
 */
orderItemSchema.methods.updatePreparationStatus = async function(
  this: IOrderItem,
  newStatus: PreparationStatus,
  chefId?: string
): Promise<IOrderItem> {
  this.preparationStatus = newStatus;
  
  const now = new Date();
  
  switch (newStatus) {
    case PreparationStatus.PREPARING:
      this.startedPreparingAt = now;
      if (chefId) this.assignedChef = new mongoose.Types.ObjectId(chefId) as any;
      break;
    case PreparationStatus.READY:
      this.finishedPreparingAt = now;
      break;
    case PreparationStatus.SERVED:
      this.servedAt = now;
      break;
  }
  
  return await this.save();
};

// ==================== MÉTODOS ESTÁTICOS ====================

class OrderItemService {
  /**
   * Busca items por chef
   */
  static async findByChef(
    chefId: string,
    status?: PreparationStatus
  ): Promise<IOrderItem[]> {
    const query: any = { assignedChef: chefId };
    if (status) {
      query.preparationStatus = status;
    }
    
    return await OrderItem.find(query)
      .populate('order', 'orderNumber tableNumber status')
      .sort({ createdAt: 1 });
  }

  /**
   * Obtiene items pendientes para cocina
   */
  static async getPendingForKitchen(): Promise<IOrderItem[]> {
    return await OrderItem.find({
      preparationStatus: { 
        $in: [PreparationStatus.PENDING, PreparationStatus.PREPARING] 
      }
    })
    .populate('order', 'orderNumber tableNumber status estimatedPreparationTime')
    .populate('product', 'name preparationTime')
    .sort({ 'order.orderDate': 1, createdAt: 1 });
  }

  /**
   * Obtiene estadísticas de un producto
   */
  static async getProductStats(
    productId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalOrdered: number;
    totalRevenue: number;
    averageQuantityPerOrder: number;
    averagePrice: number;
    ordersCount: number;
  }> {
    const matchQuery: any = {
      product: new mongoose.Types.ObjectId(productId)
    };
    
    if (startDate && endDate) {
      matchQuery.createdAt = { $gte: startDate, $lte: endDate };
    }
    
    const stats = await OrderItem.aggregate([
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
  }
}

orderItemSchema.statics = Object.assign(orderItemSchema.statics, OrderItemService);

// ==================== MODELO ====================

interface IOrderItemModel extends Model<IOrderItem> {
  findByChef(chefId: string, status?: PreparationStatus): Promise<IOrderItem[]>;
  getPendingForKitchen(): Promise<IOrderItem[]>;
  getProductStats(productId: string, startDate?: Date, endDate?: Date): Promise<{
    totalOrdered: number;
    totalRevenue: number;
    averageQuantityPerOrder: number;
    averagePrice: number;
    ordersCount: number;
  }>;
}

const OrderItem = mongoose.model<IOrderItem, IOrderItemModel>('OrderItem', orderItemSchema);

export default OrderItem;