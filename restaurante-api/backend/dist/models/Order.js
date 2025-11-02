"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../types/enums");
const deliveryInfoSchema = new mongoose_1.Schema({
    address: String,
    phone: String,
    instructions: String,
    estimatedTime: Date
}, { _id: false });
const orderRatingSchema = new mongoose_1.Schema({
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
const orderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El cliente es obligatorio']
    },
    waiter: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        validate: {
            validator: async function (waiterId) {
                if (!waiterId)
                    return true;
                const User = mongoose_1.default.model('User');
                const waiter = await User.findById(waiterId);
                return waiter && waiter.role === enums_1.UserRole.WAITER;
            },
            message: 'El mesero asignado debe tener rol de waiter'
        }
    },
    items: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'OrderItem'
        }],
    status: {
        type: String,
        enum: {
            values: Object.values(enums_1.OrderStatus),
            message: 'Estado inválido'
        },
        default: enums_1.OrderStatus.PENDING
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
            values: Object.values(enums_1.PaymentMethod),
            message: 'Método de pago inválido'
        },
        default: enums_1.PaymentMethod.PENDING
    },
    paymentStatus: {
        type: String,
        enum: Object.values(enums_1.PaymentStatus),
        default: enums_1.PaymentStatus.PENDING
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ waiter: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ tableNumber: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ status: 1, orderDate: -1 });
orderSchema.index({ customer: 1, orderDate: -1 });
orderSchema.virtual('preparationTimeActual').get(function () {
    if (this.confirmedAt && this.readyAt) {
        return Math.round((this.readyAt.getTime() - this.confirmedAt.getTime()) / (1000 * 60));
    }
    return null;
});
orderSchema.virtual('isDelayed').get(function () {
    if (!this.estimatedPreparationTime || !this.confirmedAt || this.status === enums_1.OrderStatus.DELIVERED) {
        return false;
    }
    const expectedTime = new Date(this.confirmedAt.getTime() + (this.estimatedPreparationTime * 60000));
    return new Date() > expectedTime && [enums_1.OrderStatus.PREPARING, enums_1.OrderStatus.READY].includes(this.status);
});
orderSchema.virtual('remainingTime').get(function () {
    if (!this.estimatedPreparationTime ||
        !this.confirmedAt ||
        [enums_1.OrderStatus.DELIVERED, enums_1.OrderStatus.CANCELLED].includes(this.status)) {
        return null;
    }
    const expectedTime = new Date(this.confirmedAt.getTime() + (this.estimatedPreparationTime * 60000));
    const remaining = Math.round((expectedTime.getTime() - new Date().getTime()) / (1000 * 60));
    return Math.max(0, remaining);
});
orderSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const Order = mongoose_1.default.model('Order');
            const lastOrder = await Order.findOne({
                orderNumber: new RegExp(`^ORD-${dateStr}-`)
            }).sort({ orderNumber: -1 });
            let sequence = 1;
            if (lastOrder) {
                const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
                sequence = lastSequence + 1;
            }
            this.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(3, '0')}`;
        }
        catch (error) {
            return next(error);
        }
    }
    next();
});
orderSchema.pre(/^find/, function (next) {
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
orderSchema.methods.updateStatus = async function (newStatus, userId) {
    this.status = newStatus;
    const now = new Date();
    switch (newStatus) {
        case enums_1.OrderStatus.CONFIRMED:
            this.confirmedAt = now;
            if (userId) {
                const User = mongoose_1.default.model('User');
                const user = await User.findById(userId);
                if (user && user.role === enums_1.UserRole.WAITER) {
                    this.waiter = new mongoose_1.default.Types.ObjectId(userId);
                }
            }
            break;
        case enums_1.OrderStatus.PREPARING:
            if (!this.confirmedAt)
                this.confirmedAt = now;
            break;
        case enums_1.OrderStatus.READY:
            this.readyAt = now;
            if (this.confirmedAt) {
                this.actualPreparationTime = Math.round((now.getTime() - this.confirmedAt.getTime()) / (1000 * 60));
            }
            break;
        case enums_1.OrderStatus.DELIVERED:
            this.deliveredAt = now;
            this.paymentStatus = this.paymentStatus === enums_1.PaymentStatus.PENDING ? enums_1.PaymentStatus.PAID : this.paymentStatus;
            break;
        case enums_1.OrderStatus.CANCELLED:
            this.cancelledAt = now;
            this.paymentStatus = enums_1.PaymentStatus.REFUNDED;
            break;
    }
    return await this.save();
};
orderSchema.methods.calculateEstimatedTime = async function () {
    await this.populate('items');
    let maxTime = 0;
    const items = this.items;
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
class OrderService {
    static async getTodayStats() {
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
                            $cond: [{ $ne: ['$status', enums_1.OrderStatus.CANCELLED] }, '$totalAmount', 0]
                        }
                    },
                    averageOrderValue: { $avg: '$totalAmount' },
                    pendingOrders: {
                        $sum: { $cond: [{ $eq: ['$status', enums_1.OrderStatus.PENDING] }, 1, 0] }
                    },
                    preparingOrders: {
                        $sum: { $cond: [{ $eq: ['$status', enums_1.OrderStatus.PREPARING] }, 1, 0] }
                    },
                    completedOrders: {
                        $sum: { $cond: [{ $eq: ['$status', enums_1.OrderStatus.DELIVERED] }, 1, 0] }
                    },
                    cancelledOrders: {
                        $sum: { $cond: [{ $eq: ['$status', enums_1.OrderStatus.CANCELLED] }, 1, 0] }
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
const Order = mongoose_1.default.model('Order', orderSchema);
exports.default = Order;
//# sourceMappingURL=Order.js.map