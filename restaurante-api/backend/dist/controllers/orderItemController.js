"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const enums_1 = require("../types/enums");
class OrderItemController {
    static async getAllOrderItems(req, res) {
        try {
            const { status, orderId, chefId } = req.query;
            const query = {};
            if (status) {
                query.preparationStatus = status;
            }
            if (orderId) {
                query.order = orderId;
            }
            if (chefId) {
                query.assignedChef = chefId;
            }
            const items = await OrderItem_1.default.find(query).sort({ createdAt: -1 });
            res.status(200).json({
                success: true,
                data: items
            });
        }
        catch (error) {
            console.error('Error en getAllOrderItems:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener items',
                error: error.message
            });
        }
    }
    static async getOrderItemById(req, res) {
        try {
            const { id } = req.params;
            const item = await OrderItem_1.default.findById(id);
            if (!item) {
                res.status(404).json({
                    success: false,
                    message: 'Item no encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: item
            });
        }
        catch (error) {
            console.error('Error en getOrderItemById:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener item',
                error: error.message
            });
        }
    }
    static async updatePreparationStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!status || !Object.values(enums_1.PreparationStatus).includes(status)) {
                res.status(400).json({
                    success: false,
                    message: 'Estado de preparación inválido'
                });
                return;
            }
            const item = await OrderItem_1.default.findById(id);
            if (!item) {
                res.status(404).json({
                    success: false,
                    message: 'Item no encontrado'
                });
                return;
            }
            const chefId = req.user?.role === enums_1.UserRole.CHEF
                ? req.user._id.toString()
                : undefined;
            await item.updatePreparationStatus(status, chefId);
            res.status(200).json({
                success: true,
                message: 'Estado de preparación actualizado',
                data: item
            });
        }
        catch (error) {
            console.error('Error en updatePreparationStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado',
                error: error.message
            });
        }
    }
    static async assignChef(req, res) {
        try {
            const { id } = req.params;
            const { chefId } = req.body;
            const item = await OrderItem_1.default.findById(id);
            if (!item) {
                res.status(404).json({
                    success: false,
                    message: 'Item no encontrado'
                });
                return;
            }
            item.assignedChef = chefId;
            await item.save();
            res.status(200).json({
                success: true,
                message: 'Chef asignado exitosamente',
                data: item
            });
        }
        catch (error) {
            console.error('Error en assignChef:', error);
            res.status(500).json({
                success: false,
                message: 'Error al asignar chef',
                error: error.message
            });
        }
    }
    static async getItemsByChef(req, res) {
        try {
            const { chefId } = req.params;
            const { status } = req.query;
            const items = await OrderItem_1.default.findByChef(chefId, status);
            res.status(200).json({
                success: true,
                data: items
            });
        }
        catch (error) {
            console.error('Error en getItemsByChef:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener items del chef',
                error: error.message
            });
        }
    }
    static async getPendingForKitchen(_req, res) {
        try {
            const items = await OrderItem_1.default.getPendingForKitchen();
            res.status(200).json({
                success: true,
                data: items
            });
        }
        catch (error) {
            console.error('Error en getPendingForKitchen:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener items pendientes',
                error: error.message
            });
        }
    }
    static async getProductStats(req, res) {
        try {
            const { productId } = req.params;
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const stats = await OrderItem_1.default.getProductStats(productId, start, end);
            res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error en getProductStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del producto',
                error: error.message
            });
        }
    }
    static async updatePreparationNotes(req, res) {
        try {
            const { id } = req.params;
            const { notes } = req.body;
            const item = await OrderItem_1.default.findById(id);
            if (!item) {
                res.status(404).json({
                    success: false,
                    message: 'Item no encontrado'
                });
                return;
            }
            item.preparationNotes = notes;
            await item.save();
            res.status(200).json({
                success: true,
                message: 'Notas actualizadas exitosamente',
                data: item
            });
        }
        catch (error) {
            console.error('Error en updatePreparationNotes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar notas',
                error: error.message
            });
        }
    }
    static async rateItem(req, res) {
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
            const item = await OrderItem_1.default.findById(id).populate('order');
            if (!item) {
                res.status(404).json({
                    success: false,
                    message: 'Item no encontrado'
                });
                return;
            }
            const order = item.order;
            if (order.customer.toString() !== req.user?._id.toString()) {
                res.status(403).json({
                    success: false,
                    message: 'No autorizado para calificar este item'
                });
                return;
            }
            item.itemRating = {
                score,
                comment
            };
            await item.save();
            res.status(200).json({
                success: true,
                message: 'Item calificado exitosamente',
                data: item
            });
        }
        catch (error) {
            console.error('Error en rateItem:', error);
            res.status(500).json({
                success: false,
                message: 'Error al calificar item',
                error: error.message
            });
        }
    }
}
exports.default = OrderItemController;
//# sourceMappingURL=orderItemController.js.map