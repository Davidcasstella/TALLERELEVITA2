"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Order_1 = __importDefault(require("../models/Order"));
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const Product_1 = __importDefault(require("../models/Product"));
const enums_1 = require("../types/enums");
class OrderController {
    static async getAllOrders(req, res) {
        try {
            const { status, tableNumber, page = 1, limit = 10 } = req.query;
            const query = {};
            if (req.user?.role === enums_1.UserRole.CUSTOMER) {
                query.customer = req.user._id;
            }
            if (status) {
                query.status = status;
            }
            if (tableNumber) {
                query.tableNumber = Number(tableNumber);
            }
            const skip = (Number(page) - 1) * Number(limit);
            const [orders, total] = await Promise.all([
                Order_1.default.find(query)
                    .populate('customer', 'name email')
                    .populate({
                    path: 'items',
                    populate: {
                        path: 'product',
                        select: 'name price image category'
                    }
                })
                    .skip(skip)
                    .limit(Number(limit))
                    .sort({ createdAt: -1 }),
                Order_1.default.countDocuments(query)
            ]);
            res.status(200).json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        total,
                        page: Number(page),
                        pages: Math.ceil(total / Number(limit)),
                        limit: Number(limit)
                    }
                }
            });
        }
        catch (error) {
            console.error('Error en getAllOrders:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener pedidos',
                error: error.message
            });
        }
    }
    static async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const order = await Order_1.default.findById(id)
                .populate('customer', 'name email')
                .populate({
                path: 'items',
                populate: {
                    path: 'product',
                    select: 'name price image category'
                }
            });
            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
                return;
            }
            if (req.user?.role === enums_1.UserRole.CUSTOMER &&
                order.customer.toString() !== req.user._id.toString()) {
                res.status(403).json({
                    success: false,
                    message: 'No autorizado para ver este pedido'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: order
            });
        }
        catch (error) {
            console.error('Error en getOrderById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener pedido',
                error: error.message
            });
        }
    }
    static async createOrder(req, res) {
        console.log('🔵 Iniciando creación de pedido...');
        console.log('📦 Usuario autenticado:', req.user);
        console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const orderData = req.body;
            const { items, tableNumber, notes, customerNotes, paymentMethod } = orderData;
            if (!req.user || !req.user._id) {
                console.error('❌ Usuario no autenticado');
                await session.abortTransaction();
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
                return;
            }
            if (!items || !Array.isArray(items) || items.length === 0) {
                console.error('❌ No hay items en el pedido');
                await session.abortTransaction();
                res.status(400).json({
                    success: false,
                    message: 'Debe incluir al menos un producto'
                });
                return;
            }
            if (!tableNumber) {
                console.error('❌ Falta número de mesa');
                await session.abortTransaction();
                res.status(400).json({
                    success: false,
                    message: 'El número de mesa es obligatorio'
                });
                return;
            }
            console.log('✅ Validaciones básicas pasadas');
            console.log('📋 Procesando', items.length, 'items...');
            const orderItems = [];
            let subtotal = 0;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                console.log(`📦 Procesando item ${i + 1}:`, item);
                if (!item.product) {
                    console.error(`❌ Item ${i + 1} no tiene producto`);
                    await session.abortTransaction();
                    res.status(400).json({
                        success: false,
                        message: `Item ${i + 1} no tiene producto asociado`
                    });
                    return;
                }
                const product = await Product_1.default.findById(item.product);
                if (!product) {
                    console.error(`❌ Producto ${item.product} no encontrado`);
                    await session.abortTransaction();
                    res.status(404).json({
                        success: false,
                        message: `Producto ${item.product} no encontrado`
                    });
                    return;
                }
                console.log(`✅ Producto encontrado: ${product.name} - $${product.price}`);
                if (!product.isAvailable) {
                    console.error(`❌ Producto ${product.name} no disponible`);
                    await session.abortTransaction();
                    res.status(400).json({
                        success: false,
                        message: `El producto ${product.name} no está disponible`
                    });
                    return;
                }
                if (!item.quantity || item.quantity < 1) {
                    console.error(`❌ Cantidad inválida para ${product.name}`);
                    await session.abortTransaction();
                    res.status(400).json({
                        success: false,
                        message: 'La cantidad debe ser al menos 1'
                    });
                    return;
                }
                const itemSubtotal = product.price * item.quantity;
                subtotal += itemSubtotal;
                console.log(`💰 Subtotal del item: $${itemSubtotal}`);
                const orderItemData = {
                    product: product._id,
                    productSnapshot: {
                        name: product.name,
                        description: product.description || '',
                        image: product.image || '',
                        category: product.category
                    },
                    quantity: item.quantity,
                    unitPrice: product.price,
                    subtotal: itemSubtotal,
                    specialInstructions: item.specialInstructions || '',
                    modifications: item.modifications || []
                };
                orderItems.push(orderItemData);
            }
            const tax = subtotal * 0.19;
            const totalAmount = subtotal + tax;
            console.log('💰 Cálculos finales:');
            console.log('   Subtotal:', subtotal);
            console.log('   IVA (19%):', tax);
            console.log('   Total:', totalAmount);
            const orderDoc = {
                orderNumber: `ORD-${Date.now()}`,
                customer: req.user._id,
                tableNumber,
                subtotal,
                tax,
                totalAmount,
                paymentMethod: paymentMethod || 'pending',
                notes: notes || '',
                customerNotes: customerNotes || '',
                status: enums_1.OrderStatus.PENDING,
                paymentStatus: enums_1.PaymentStatus.PENDING
            };
            console.log('📝 Creando documento de pedido...');
            const [order] = await Order_1.default.create([orderDoc], { session });
            console.log('✅ Pedido creado con ID:', order._id);
            console.log('📝 Creando items del pedido...');
            const createdItems = await Promise.all(orderItems.map(itemData => OrderItem_1.default.create([{ ...itemData, order: order._id }], { session })));
            console.log('✅ Items creados:', createdItems.length);
            order.items = createdItems.map(([item]) => item._id);
            await order.save({ session });
            console.log('✅ Pedido actualizado con items');
            console.log('⏭️  Saltando calculateEstimatedTime (no implementado)');
            console.log('📈 Actualizando popularidad de productos...');
            await Promise.all(items.map(item => Product_1.default.findByIdAndUpdate(item.product, { $inc: { popularity: item.quantity } })));
            await session.commitTransaction();
            console.log('✅ Transacción completada exitosamente');
            const fullOrder = await Order_1.default.findById(order._id)
                .populate('customer', 'name email')
                .populate({
                path: 'items',
                populate: {
                    path: 'product',
                    select: 'name price image category'
                }
            });
            console.log('✅ Pedido completo obtenido');
            res.status(201).json({
                success: true,
                message: 'Pedido creado exitosamente',
                data: fullOrder
            });
            console.log('✅ Respuesta enviada al cliente');
        }
        catch (error) {
            await session.abortTransaction();
            console.error('❌ ERROR COMPLETO en createOrder:', error);
            console.error('❌ Stack:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Error al crear pedido',
                error: error.message
            });
        }
        finally {
            session.endSession();
        }
    }
    static async updateOrder(req, res) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const { id } = req.params;
            const { items, tableNumber, notes, paymentMethod, status } = req.body;
            const order = await Order_1.default.findById(id);
            if (!order) {
                await session.abortTransaction();
                res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
                return;
            }
            if (req.user?.role === enums_1.UserRole.CUSTOMER &&
                order.customer.toString() !== req.user._id.toString()) {
                await session.abortTransaction();
                res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
                return;
            }
            if (items && Array.isArray(items)) {
                await OrderItem_1.default.deleteMany({ order: order._id }, { session });
                const orderItems = [];
                let subtotal = 0;
                for (const item of items) {
                    const product = await Product_1.default.findById(item.product);
                    if (!product) {
                        await session.abortTransaction();
                        res.status(404).json({
                            success: false,
                            message: `Producto ${item.product} no encontrado`
                        });
                        return;
                    }
                    const itemSubtotal = product.price * item.quantity;
                    subtotal += itemSubtotal;
                    const orderItemData = {
                        order: order._id,
                        product: product._id,
                        productSnapshot: {
                            name: product.name,
                            description: product.description,
                            image: product.image,
                            category: product.category
                        },
                        quantity: item.quantity,
                        unitPrice: product.price,
                        subtotal: itemSubtotal,
                        specialInstructions: item.specialInstructions || ''
                    };
                    orderItems.push(orderItemData);
                }
                const createdItems = await OrderItem_1.default.create(orderItems, { session });
                const tax = subtotal * 0.19;
                const totalAmount = subtotal + tax;
                order.items = createdItems.map(item => item._id);
                order.subtotal = subtotal;
                order.tax = tax;
                order.totalAmount = totalAmount;
            }
            if (tableNumber !== undefined)
                order.tableNumber = tableNumber;
            if (notes !== undefined)
                order.notes = notes;
            if (paymentMethod !== undefined)
                order.paymentMethod = paymentMethod;
            if (status !== undefined)
                order.status = status;
            await order.save({ session });
            await session.commitTransaction();
            const updatedOrder = await Order_1.default.findById(order._id)
                .populate('customer', 'name email')
                .populate({
                path: 'items',
                populate: {
                    path: 'product',
                    select: 'name price image category'
                }
            });
            res.status(200).json({
                success: true,
                message: 'Pedido actualizado exitosamente',
                data: updatedOrder
            });
        }
        catch (error) {
            await session.abortTransaction();
            console.error('Error en updateOrder:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar pedido',
                error: error.message
            });
        }
        finally {
            session.endSession();
        }
    }
    static async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status || !Object.values(enums_1.OrderStatus).includes(status)) {
                res.status(400).json({
                    success: false,
                    message: 'Estado inválido'
                });
                return;
            }
            const order = await Order_1.default.findById(id);
            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
                return;
            }
            if (typeof order.updateStatus === 'function') {
                await order.updateStatus(status, req.user?._id.toString());
            }
            else {
                order.status = status;
                await order.save();
            }
            res.status(200).json({
                success: true,
                message: 'Estado del pedido actualizado',
                data: order
            });
        }
        catch (error) {
            console.error('Error en updateOrderStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado',
                error: error.message
            });
        }
    }
    static async updatePaymentMethod(req, res) {
        try {
            const { id } = req.params;
            const { paymentMethod, transactionId } = req.body;
            const order = await Order_1.default.findById(id);
            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
                return;
            }
            if (req.user?.role === enums_1.UserRole.CUSTOMER &&
                order.customer.toString() !== req.user._id.toString()) {
                res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
                return;
            }
            order.paymentMethod = paymentMethod;
            if (transactionId)
                order.transactionId = transactionId;
            await order.save();
            res.status(200).json({
                success: true,
                message: 'Método de pago actualizado',
                data: order
            });
        }
        catch (error) {
            console.error('Error en updatePaymentMethod:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar método de pago',
                error: error.message
            });
        }
    }
    static async rateOrder(req, res) {
        try {
            const { id } = req.params;
            const { score, comment } = req.body;
            if (!score || score < 1 || score > 5) {
                res.status(400).json({
                    success: false,
                    message: 'La calificación debe estar entre 1 y 5'
                });
                return;
            }
            const order = await Order_1.default.findById(id);
            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
                return;
            }
            if (order.customer.toString() !== req.user?._id.toString()) {
                res.status(403).json({
                    success: false,
                    message: 'No autorizado para calificar este pedido'
                });
                return;
            }
            if (order.status !== enums_1.OrderStatus.DELIVERED) {
                res.status(400).json({
                    success: false,
                    message: 'Solo se pueden calificar pedidos entregados'
                });
                return;
            }
            order.rating = {
                score,
                comment,
                ratedAt: new Date()
            };
            await order.save();
            res.status(200).json({
                success: true,
                message: 'Pedido calificado exitosamente',
                data: order
            });
        }
        catch (error) {
            console.error('Error en rateOrder:', error);
            res.status(500).json({
                success: false,
                message: 'Error al calificar pedido',
                error: error.message
            });
        }
    }
    static async getTodayStats(_req, res) {
        try {
            if (typeof Order_1.default.getTodayStats === 'function') {
                const stats = await Order_1.default.getTodayStats();
                res.status(200).json({
                    success: true,
                    data: stats
                });
            }
            else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const count = await Order_1.default.countDocuments({
                    createdAt: { $gte: today }
                });
                res.status(200).json({
                    success: true,
                    data: { todayOrders: count }
                });
            }
        }
        catch (error) {
            console.error('Error en getTodayStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    }
    static async cancelOrder(req, res) {
        try {
            const { id } = req.params;
            const order = await Order_1.default.findById(id);
            if (!order) {
                res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
                return;
            }
            if (req.user?.role === enums_1.UserRole.CUSTOMER &&
                order.customer.toString() !== req.user._id.toString()) {
                res.status(403).json({
                    success: false,
                    message: 'No autorizado'
                });
                return;
            }
            if (![enums_1.OrderStatus.PENDING, enums_1.OrderStatus.CONFIRMED].includes(order.status)) {
                res.status(400).json({
                    success: false,
                    message: 'Solo se pueden cancelar pedidos pendientes o confirmados'
                });
                return;
            }
            if (typeof order.updateStatus === 'function') {
                await order.updateStatus(enums_1.OrderStatus.CANCELLED);
            }
            else {
                order.status = enums_1.OrderStatus.CANCELLED;
                await order.save();
            }
            res.status(200).json({
                success: true,
                message: 'Pedido cancelado exitosamente',
                data: order
            });
        }
        catch (error) {
            console.error('Error en cancelOrder:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cancelar pedido',
                error: error.message
            });
        }
    }
}
exports.default = OrderController;
//# sourceMappingURL=orderController.js.map