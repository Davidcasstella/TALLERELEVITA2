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
const categorySchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.virtual('productCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});
categorySchema.statics.findByName = async function (name) {
    return await this.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
};
categorySchema.statics.getActive = async function () {
    return await this.find({ isActive: true })
        .sort({ sortOrder: 1, createdAt: -1 });
};
categorySchema.statics.getAllWithProductCount = async function () {
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
categorySchema.statics.hasProducts = async function (categoryId) {
    const Product = mongoose_1.default.model('Product');
    const count = await Product.countDocuments({ category: categoryId });
    return count > 0;
};
categorySchema.statics.isNameUnique = async function (name, excludeId) {
    const query = {
        name: { $regex: new RegExp(`^${name}$`, 'i') }
    };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    const existing = await this.findOne(query);
    return !existing;
};
categorySchema.statics.softDelete = async function (categoryId) {
    const category = await this.findById(categoryId);
    if (!category) {
        throw new Error(enums_1.ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }
    const Product = mongoose_1.default.model('Product');
    const productCount = await Product.countDocuments({ category: categoryId });
    if (productCount > 0) {
        throw new Error('No se puede eliminar una categoría con productos asociados');
    }
    category.isActive = false;
    await category.save();
};
categorySchema.statics.reorder = async function (categoryIds) {
    const updates = categoryIds.map((id, index) => ({
        updateOne: {
            filter: { _id: id },
            update: { sortOrder: index }
        }
    }));
    await this.bulkWrite(updates);
};
categorySchema.statics.getStats = async function () {
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
        ]).then((result) => result[0]?.count || 0)
    ]);
    return {
        total,
        active,
        inactive: total - active,
        withProducts
    };
};
const Category = mongoose_1.default.model('Category', categorySchema);
exports.default = Category;
//# sourceMappingURL=Category.js.map