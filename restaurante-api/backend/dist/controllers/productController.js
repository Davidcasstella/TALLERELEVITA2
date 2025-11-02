"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Product_1 = __importDefault(require("../models/Product"));
class ProductController {
    static async getAllProducts(req, res) {
        try {
            const { category, available, search, minPrice, maxPrice, page = '1', limit = '10', sortBy = 'createdAt', order = 'desc' } = req.query;
            const filters = {};
            if (category) {
                filters.category = category;
            }
            if (available !== undefined) {
                filters.isAvailable = available === 'true';
            }
            if (search) {
                filters.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
            if (minPrice || maxPrice) {
                filters.price = {};
                if (minPrice)
                    filters.price.$gte = Number(minPrice);
                if (maxPrice)
                    filters.price.$lte = Number(maxPrice);
            }
            const pageNum = Number(page);
            const limitNum = Number(limit);
            const skip = (pageNum - 1) * limitNum;
            const sort = {};
            sort[sortBy] = order === 'asc' ? 1 : -1;
            const [products, total] = await Promise.all([
                Product_1.default.find(filters)
                    .sort(sort)
                    .limit(limitNum)
                    .skip(skip)
                    .populate('category'),
                Product_1.default.countDocuments(filters)
            ]);
            res.status(200).json({
                success: true,
                data: products,
                pagination: {
                    total,
                    page: pageNum,
                    pages: Math.ceil(total / limitNum),
                    limit: limitNum
                }
            });
        }
        catch (error) {
            console.error('Error en getAllProducts:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos',
                error: error.message
            });
        }
    }
    static async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await Product_1.default.findById(id).populate('category');
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: product
            });
        }
        catch (error) {
            console.error('Error en getProductById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener producto',
                error: error.message
            });
        }
    }
    static async createProduct(req, res) {
        try {
            const productData = req.body;
            if (!productData.name || !productData.price || !productData.category) {
                res.status(400).json({
                    success: false,
                    message: 'Nombre, precio y categoría son obligatorios'
                });
                return;
            }
            const product = await Product_1.default.create(productData);
            res.status(201).json({
                success: true,
                message: 'Producto creado exitosamente',
                data: product
            });
        }
        catch (error) {
            console.error('Error en createProduct:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear producto',
                error: error.message
            });
        }
    }
    static async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const product = await Product_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Producto actualizado exitosamente',
                data: product
            });
        }
        catch (error) {
            console.error('Error en updateProduct:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar producto',
                error: error.message
            });
        }
    }
    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await Product_1.default.findByIdAndDelete(id);
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        }
        catch (error) {
            console.error('Error en deleteProduct:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar producto',
                error: error.message
            });
        }
    }
    static async getProductsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const products = await Product_1.default.find({
                category: categoryId,
                isAvailable: true
            }).populate('category');
            res.status(200).json({
                success: true,
                data: products
            });
        }
        catch (error) {
            console.error('Error en getProductsByCategory:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos por categoría',
                error: error.message
            });
        }
    }
    static async getTopRatedProducts(req, res) {
        try {
            const { limit = '10' } = req.query;
            const products = await Product_1.default.find({ isAvailable: true })
                .sort({ averageRating: -1 })
                .limit(Number(limit))
                .populate('category');
            res.status(200).json({
                success: true,
                data: products
            });
        }
        catch (error) {
            console.error('Error en getTopRatedProducts:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos mejor valorados',
                error: error.message
            });
        }
    }
    static async getBestSellers(req, res) {
        try {
            const { limit = '10' } = req.query;
            const products = await Product_1.default.find({ isAvailable: true })
                .sort({ salesCount: -1 })
                .limit(Number(limit))
                .populate('category');
            res.status(200).json({
                success: true,
                data: products
            });
        }
        catch (error) {
            console.error('Error en getBestSellers:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos más vendidos',
                error: error.message
            });
        }
    }
    static async getProductsByDietaryPreferences(req, res) {
        try {
            const { vegetarian, vegan, glutenFree } = req.query;
            const filters = { isAvailable: true };
            if (vegetarian === 'true') {
                filters['dietaryInfo.isVegetarian'] = true;
            }
            if (vegan === 'true') {
                filters['dietaryInfo.isVegan'] = true;
            }
            if (glutenFree === 'true') {
                filters['dietaryInfo.isGlutenFree'] = true;
            }
            const products = await Product_1.default.find(filters).populate('category');
            res.status(200).json({
                success: true,
                data: products
            });
        }
        catch (error) {
            console.error('Error en getProductsByDietaryPreferences:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener productos por preferencias',
                error: error.message
            });
        }
    }
    static async bulkUpdateAvailability(req, res) {
        try {
            const { productIds, isAvailable } = req.body;
            if (!Array.isArray(productIds) || typeof isAvailable !== 'boolean') {
                res.status(400).json({
                    success: false,
                    message: 'Se requiere un array de IDs y un estado booleano'
                });
                return;
            }
            await Product_1.default.updateMany({ _id: { $in: productIds } }, { isAvailable });
            res.status(200).json({
                success: true,
                message: `Disponibilidad actualizada para ${productIds.length} productos`
            });
        }
        catch (error) {
            console.error('Error en bulkUpdateAvailability:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar disponibilidad',
                error: error.message
            });
        }
    }
    static async getProductStats(_req, res) {
        try {
            const [total, available, unavailable, byCategory] = await Promise.all([
                Product_1.default.countDocuments(),
                Product_1.default.countDocuments({ isAvailable: true }),
                Product_1.default.countDocuments({ isAvailable: false }),
                Product_1.default.aggregate([
                    {
                        $group: {
                            _id: '$category',
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);
            res.status(200).json({
                success: true,
                data: {
                    total,
                    available,
                    unavailable,
                    byCategory
                }
            });
        }
        catch (error) {
            console.error('Error en getProductStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    }
}
exports.default = ProductController;
//# sourceMappingURL=productController.js.map