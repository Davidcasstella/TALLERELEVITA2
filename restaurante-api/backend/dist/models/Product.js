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
const productSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [enums_1.CONSTANTS.MAX_DESCRIPTION_LENGTH, `La descripción no puede exceder ${enums_1.CONSTANTS.MAX_DESCRIPTION_LENGTH} caracteres`],
        default: undefined
    },
    price: {
        type: Number,
        required: [true, 'El precio es obligatorio'],
        min: [enums_1.CONSTANTS.MIN_PRICE, 'El precio no puede ser negativo'],
        max: [enums_1.CONSTANTS.MAX_PRICE, 'El precio es demasiado alto']
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        min: [enums_1.CONSTANTS.MIN_PREPARATION_TIME, `El tiempo mínimo es ${enums_1.CONSTANTS.MIN_PREPARATION_TIME} minuto`],
        max: [enums_1.CONSTANTS.MAX_PREPARATION_TIME, `El tiempo máximo es ${enums_1.CONSTANTS.MAX_PREPARATION_TIME} minutos`]
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
}, {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ popularity: -1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.virtual('isVeganFriendly').get(function () {
    return this.isVegan || this.isVegetarian;
});
productSchema.virtual('spicyDescription').get(function () {
    const levels = ['Sin picante', 'Suave', 'Medio', 'Picante', 'Muy picante', 'Extremadamente picante'];
    return levels[this.spicyLevel] || 'Sin picante';
});
productSchema.pre('save', function (next) {
    if (this.isVegan) {
        this.isVegetarian = true;
    }
    next();
});
productSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'category',
        select: 'name description icon'
    });
    next();
});
productSchema.methods.incrementPopularity = async function () {
    this.popularity += 1;
    await this.save();
};
productSchema.methods.updateRating = async function (newRating) {
    const totalRating = (this.rating * this.reviewCount) + newRating;
    this.reviewCount += 1;
    this.rating = totalRating / this.reviewCount;
    await this.save();
};
class ProductService {
    static async findWithFilters(filters) {
        const { category, available, search, minPrice, maxPrice, page = 1, limit = enums_1.CONSTANTS.DEFAULT_PAGE_SIZE, sortBy = 'createdAt', order = 'desc' } = filters;
        const query = {};
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
            if (minPrice !== undefined)
                query.price.$gte = minPrice;
            if (maxPrice !== undefined)
                query.price.$lte = maxPrice;
        }
        const skip = (page - 1) * limit;
        const sortOrder = order === 'desc' ? -1 : 1;
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
    static async getAvailableByCategory(categoryId) {
        return await Product.find({
            category: categoryId,
            isAvailable: true
        }).sort({ popularity: -1, rating: -1 });
    }
    static async getTopRated(limit = 10) {
        return await Product.find({ isAvailable: true })
            .sort({ rating: -1, reviewCount: -1 })
            .limit(limit);
    }
    static async getBestSellers(limit = 10) {
        return await Product.find({ isAvailable: true })
            .sort({ popularity: -1 })
            .limit(limit);
    }
    static async findByDietaryPreferences(preferences) {
        const query = { isAvailable: true };
        if (preferences.vegan) {
            query.isVegan = true;
        }
        else if (preferences.vegetarian) {
            query.isVegetarian = true;
        }
        if (preferences.glutenFree) {
            query.isGlutenFree = true;
        }
        return await Product.find(query).sort({ rating: -1 });
    }
    static async bulkUpdateAvailability(productIds, isAvailable) {
        await Product.updateMany({ _id: { $in: productIds } }, { isAvailable });
    }
    static async getStats() {
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
productSchema.statics = Object.assign(productSchema.statics, ProductService);
const Product = mongoose_1.default.model('Product', productSchema);
exports.default = Product;
//# sourceMappingURL=Product.js.map