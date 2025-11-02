import { Response } from 'express';
import OrderItem from '../models/OrderItem';
import { AuthRequest } from './authController';
import { PreparationStatus, UserRole } from '../types/enums';

/**
 * Controlador de Items de Pedido
 */
class OrderItemController {
  /**
   * @desc    Obtener todos los items (con filtros)
   * @route   GET /api/order-items
   * @access  Private
   */
  static async getAllOrderItems(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, orderId, chefId } = req.query;

      const query: any = {};

      if (status) {
        query.preparationStatus = status;
      }

      if (orderId) {
        query.order = orderId;
      }

      if (chefId) {
        query.assignedChef = chefId;
      }

      const items = await OrderItem.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error: any) {
      console.error('Error en getAllOrderItems:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener items',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener item por ID
   * @route   GET /api/order-items/:id
   * @access  Private
   */
  static async getOrderItemById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const item = await OrderItem.findById(id);

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
    } catch (error: any) {
      console.error('Error en getOrderItemById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener item',
        error: error.message
      });
    }
  }

  /**
   * @desc    Actualizar estado de preparación
   * @route   PATCH /api/order-items/:id/status
   * @access  Private/Chef/Admin
   */
  static async updatePreparationStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(PreparationStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Estado de preparación inválido'
        });
        return;
      }

      const item = await OrderItem.findById(id);

      if (!item) {
        res.status(404).json({
          success: false,
          message: 'Item no encontrado'
        });
        return;
      }

      // Si es chef, asignarlo automáticamente
      const chefId = req.user?.role === UserRole.CHEF 
        ? req.user._id.toString() 
        : undefined;

      await item.updatePreparationStatus(status, chefId);

      res.status(200).json({
        success: true,
        message: 'Estado de preparación actualizado',
        data: item
      });
    } catch (error: any) {
      console.error('Error en updatePreparationStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado',
        error: error.message
      });
    }
  }

  /**
   * @desc    Asignar chef a item
   * @route   PATCH /api/order-items/:id/assign-chef
   * @access  Private/Chef/Admin
   */
  static async assignChef(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { chefId } = req.body;

      const item = await OrderItem.findById(id);

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
    } catch (error: any) {
      console.error('Error en assignChef:', error);
      res.status(500).json({
        success: false,
        message: 'Error al asignar chef',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener items por chef
   * @route   GET /api/order-items/chef/:chefId
   * @access  Private/Chef/Admin
   */
  static async getItemsByChef(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { chefId } = req.params;
      const { status } = req.query;

      const items = await OrderItem.findByChef(
        chefId,
        status as PreparationStatus | undefined
      );

      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error: any) {
      console.error('Error en getItemsByChef:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener items del chef',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener items pendientes para cocina
   * @route   GET /api/order-items/kitchen/pending
   * @access  Private/Chef/Admin
   */
  static async getPendingForKitchen(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const items = await OrderItem.getPendingForKitchen();

      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error: any) {
      console.error('Error en getPendingForKitchen:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener items pendientes',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener estadísticas de un producto
   * @route   GET /api/order-items/product/:productId/stats
   * @access  Private/Admin
   */
  static async getProductStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await OrderItem.getProductStats(productId, start, end);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error en getProductStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del producto',
        error: error.message
      });
    }
  }

  /**
   * @desc    Actualizar notas de preparación
   * @route   PATCH /api/order-items/:id/notes
   * @access  Private/Chef/Admin
   */
  static async updatePreparationNotes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const item = await OrderItem.findById(id);

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
    } catch (error: any) {
      console.error('Error en updatePreparationNotes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar notas',
        error: error.message
      });
    }
  }

  /**
   * @desc    Calificar item específico
   * @route   POST /api/order-items/:id/rating
   * @access  Private/Customer
   */
  static async rateItem(req: AuthRequest, res: Response): Promise<void> {
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

      const item = await OrderItem.findById(id).populate('order');

      if (!item) {
        res.status(404).json({
          success: false,
          message: 'Item no encontrado'
        });
        return;
      }

      // Verificar que el usuario sea el dueño del pedido
      const order = item.order as any;
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
    } catch (error: any) {
      console.error('Error en rateItem:', error);
      res.status(500).json({
        success: false,
        message: 'Error al calificar item',
        error: error.message
      });
    }
  }
}

export default OrderItemController;