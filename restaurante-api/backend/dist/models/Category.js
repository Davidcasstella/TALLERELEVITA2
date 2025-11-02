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
class CategoryService {
    static async findByName(name) {
        return await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
    }
    static async getActive() {
        return await Category.find({ isActive: true })
            .sort({ sortOrder: 1, createdAt: -1 });
    }
    static async getAllWithProductCount() {
        return await Category.find()
            .populate('productCount')
            .sort({ sortOrder: 1 });
    }
    static async hasProducts(categoryId) {
        const Product = mongoose_1.default.model('Product');
        const count = await Product.countDocuments({ category: categoryId });
        return count > 0;
    }
    static async isNameUnique(name, excludeId) {
        const query = { name: { $regex: new RegExp(`^${name}$`, 'i') } };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const existing = await Category.findOne(query);
        return !existing;
    }
    static async softDelete(categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
            throw new Error(enums_1.ERROR_MESSAGES.CATEGORY_NOT_FOUND);
        }
        const hasProducts = await this.hasProducts(categoryId);
        if (hasProducts) {
            throw new Error('No se puede eliminar una categoría con productos asociados');
        }
        category.isActive = false;
        await category.save();
    }
    static async reorder(categoryIds) {
        const updates = categoryIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { sortOrder: index }
            }
        }));
        await Category.bulkWrite(updates);
    }
    static async getStats() {
        const [total, active, withProducts] = await Promise.all([
            Category.countDocuments(),
            Category.countDocuments({ isActive: true }),
            Category.aggregate([
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
            ]).then(result => result[0]?.count || 0)
        ]);
        return {
            total,
            active,
            inactive: total - active,
            withProducts
        };
    }
}
categorySchema.statics = Object.assign(categorySchema.statics, CategoryService);
const Category = mongoose_1.default.model('Category', categorySchema);
exports.default = Category;
//# sourceMappingURL=Category.js.map