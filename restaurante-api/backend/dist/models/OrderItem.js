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
const modificationSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(enums_1.ModificationType),
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
const itemDiscountSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(enums_1.DiscountType),
        default: enums_1.DiscountType.PERCENTAGE
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
const itemRatingSchema = new mongoose_1.Schema({
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
const orderItemSchema = new mongoose_1.Schema({
    order: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'La referencia al pedido es obligatoria']
    },
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(enums_1.PreparationStatus),
        default: enums_1.PreparationStatus.PENDING
    },
    preparationNotes: {
        type: String,
        trim: true,
        maxlength: 200
    },
    assignedChef: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        validate: {
            validator: async function (chefId) {
                if (!chefId)
                    return true;
                const User = mongoose_1.default.model('User');
                const chef = await User.findById(chefId);
                return chef && chef.role === 'chef';
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
orderItemSchema.index({ order: 1 });
orderItemSchema.index({ product: 1 });
orderItemSchema.index({ preparationStatus: 1 });
orderItemSchema.index({ assignedChef: 1 });
orderItemSchema.index({ preparationStatus: 1, assignedChef: 1 });
orderItemSchema.virtual('preparationTime').get(function () {
    if (this.startedPreparingAt && this.finishedPreparingAt) {
        return Math.round((this.finishedPreparingAt.getTime() - this.startedPreparingAt.getTime()) / (1000 * 60));
    }
    return null;
});
orderItemSchema.virtual('isDelayed').get(function () {
    if (!this.startedPreparingAt ||
        this.preparationStatus === enums_1.PreparationStatus.READY ||
        this.preparationStatus === enums_1.PreparationStatus.SERVED) {
        return false;
    }
    const product = this.product;
    const preparationTime = product?.preparationTime || 15;
    const expectedTime = new Date(this.startedPreparingAt.getTime() + ((preparationTime + 5) * 60000));
    return new Date() > expectedTime;
});
orderItemSchema.virtual('modificationsText').get(function () {
    if (!this.modifications || this.modifications.length === 0) {
        return null;
    }
    return this.modifications.map(mod => {
        let text = '';
        switch (mod.type) {
            case enums_1.ModificationType.ADD:
                text = `Agregar ${mod.item}`;
                break;
            case enums_1.ModificationType.REMOVE:
                text = `Sin ${mod.item}`;
                break;
            case enums_1.ModificationType.EXTRA:
                text = `Extra ${mod.item}`;
                break;
            case enums_1.ModificationType.LESS:
                text = `Poco ${mod.item}`;
                break;
            case enums_1.ModificationType.SUBSTITUTE:
                text = `Sustituir por ${mod.item}`;
                break;
        }
        if (mod.additionalCost > 0) {
            text += ` (+$${mod.additionalCost})`;
        }
        return text;
    }).join(', ');
});
orderItemSchema.pre('save', async function (next) {
    try {
        if (!this.subtotal || this.isModified('quantity') || this.isModified('unitPrice')) {
            this.subtotal = this.quantity * this.unitPrice;
        }
        if (this.modifications && this.modifications.length > 0) {
            const additionalCost = this.modifications.reduce((total, mod) => {
                return total + (mod.additionalCost * this.quantity);
            }, 0);
            this.subtotal += additionalCost;
        }
        if (this.discount && this.discount.value > 0) {
            let discountAmount = 0;
            if (this.discount.type === enums_1.DiscountType.PERCENTAGE) {
                discountAmount = (this.subtotal * this.discount.value) / 100;
            }
            else {
                discountAmount = this.discount.value;
            }
            this.subtotal = Math.max(0, this.subtotal - discountAmount);
        }
        if (this.isNew && this.product && !this.totalNutritionalInfo) {
            const Product = mongoose_1.default.model('Product');
            const product = await Product.findById(this.product);
            if (product && product.nutritionalInfo) {
                const nutInfo = product.nutritionalInfo;
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
    }
    catch (error) {
        next(error);
    }
});
orderItemSchema.pre(/^find/, function (next) {
    const query = this;
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
orderItemSchema.methods.updatePreparationStatus = async function (newStatus, chefId) {
    this.preparationStatus = newStatus;
    const now = new Date();
    switch (newStatus) {
        case enums_1.PreparationStatus.PREPARING:
            this.startedPreparingAt = now;
            if (chefId)
                this.assignedChef = new mongoose_1.default.Types.ObjectId(chefId);
            break;
        case enums_1.PreparationStatus.READY:
            this.finishedPreparingAt = now;
            break;
        case enums_1.PreparationStatus.SERVED:
            this.servedAt = now;
            break;
    }
    return await this.save();
};
class OrderItemService {
    static async findByChef(chefId, status) {
        const query = { assignedChef: chefId };
        if (status) {
            query.preparationStatus = status;
        }
        return await OrderItem.find(query)
            .populate('order', 'orderNumber tableNumber status')
            .sort({ createdAt: 1 });
    }
    static async getPendingForKitchen() {
        return await OrderItem.find({
            preparationStatus: {
                $in: [enums_1.PreparationStatus.PENDING, enums_1.PreparationStatus.PREPARING]
            }
        })
            .populate('order', 'orderNumber tableNumber status estimatedPreparationTime')
            .populate('product', 'name preparationTime')
            .sort({ 'order.orderDate': 1, createdAt: 1 });
    }
    static async getProductStats(productId, startDate, endDate) {
        const matchQuery = {
            product: new mongoose_1.default.Types.ObjectId(productId)
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
const OrderItem = mongoose_1.default.model('OrderItem', orderItemSchema);
exports.default = OrderItem;
//# sourceMappingURL=OrderItem.js.map