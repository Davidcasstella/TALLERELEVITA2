import { Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Product from '../models/Product';
import { AuthRequest } from './authController';
import { OrderStatus, PaymentStatus, UserRole } from '../types/enums';
import { IOrder } from '../types/interfaces';

/**
 * Interface para crear pedido
 */
interface CreateOrderItem {
  product: string;
  quantity: number;
  specialInstructions?: string;
  modifications?: Array<{
    type: string;
    item: string;
    additionalCost?: number;
  }>;
}

interface CreateOrderRequest {
  items: CreateOrderItem[];
  tableNumber: number;
  notes?: string;
  customerNotes?: string;
  paymentMethod?: string;
}

/**
 * Controlador de Pedidos
 */
class OrderController {
  /**
   * @desc    Obtener todos los pedidos
   * @route   GET /api/orders
   * @access  Private
   */
  static async getAllOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { status, tableNumber, page = 1, limit = 10 } = req.query;

      const query: any = {};

      // Si es cliente, solo ver sus pedidos
      if (req.user?.role === UserRole.CUSTOMER) {
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
        Order.find(query)
          .skip(skip)
          .limit(Number(limit))
          .sort({ orderDate: -1 }),
        Order.countDocuments(query)
      ]);

      res.status(200).json({
        success: true,
        data: orders,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit)
        }
      });
    } catch (error: any) {
      console.error('Error en getAllOrders:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener pedidos',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener pedido por ID
   * @route   GET /api/orders/:id
   * @access  Private
   */
  static async getOrderById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const order = await Order.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
        return;
      }

      // Si es cliente, solo puede ver sus propios pedidos
      if (req.user?.role === UserRole.CUSTOMER && 
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
    } catch (error: any) {
      console.error('Error en getOrderById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener pedido',
        error: error.message
      });
    }
  }

  /**
   * @desc    Crear nuevo pedido
   * @route   POST /api/orders
   * @access  Private
   */
  static async createOrder(req: AuthRequest, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderData: CreateOrderRequest = req.body;
      const { items, tableNumber, notes, customerNotes, paymentMethod } = orderData;

      // Validaciones
      if (!items || !Array.isArray(items) || items.length === 0) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          message: 'Debe incluir al menos un producto'
        });
        return;
      }

      if (!tableNumber) {
        await session.abortTransaction();
        res.status(400).json({
          success: false,
          message: 'El número de mesa es obligatorio'
        });
        return;
      }

      // Crear order items
      const orderItems: any[] = [];
      let subtotal = 0;

      for (const item of items) {
        const product = await Product.findById(item.product);

        if (!product) {
          await session.abortTransaction();
          res.status(404).json({
            success: false,
            message: `Producto ${item.product} no encontrado`
          });
          return;
        }

        if (!product.isAvailable) {
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            message: `El producto ${product.name} no está disponible`
          });
          return;
        }

        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;

        const orderItemData = {
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
          specialInstructions: item.specialInstructions,
          modifications: item.modifications || []
        };

        orderItems.push(orderItemData);
      }

      // Calcular totales
      const tax = subtotal * 0.19; // 19% IVA
      const totalAmount = subtotal + tax;

      // Crear pedido
      const orderDoc: Partial<IOrder> = {
        customer: req.user!._id as any,
        tableNumber,
        subtotal,
        tax,
        totalAmount,
        paymentMethod: paymentMethod as any || 'pending',
        notes,
        customerNotes,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING
      };

      const [order] = await Order.create([orderDoc], { session });

      // Crear order items y asociarlos
      const createdItems = await Promise.all(
        orderItems.map(itemData =>
          OrderItem.create([{ ...itemData, order: order._id }], { session })
        )
      );

      // Actualizar order con los items
      order.items = createdItems.map(([item]) => item._id) as any;
      await order.save({ session });

      // Calcular tiempo estimado
      await order.calculateEstimatedTime();

      // Incrementar popularidad de productos
      await Promise.all(
        items.map(item =>
          Product.findByIdAndUpdate(item.product, { $inc: { popularity: item.quantity } })
        )
      );

      await session.commitTransaction();

      // Obtener el pedido completo con populate
      const fullOrder = await Order.findById(order._id);

      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: fullOrder
      });
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Error en createOrder:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear pedido',
        error: error.message
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * @desc    Actualizar estado del pedido
   * @route   PATCH /api/orders/:id/status
   * @access  Private/Waiter/Admin
   */
  static async updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(OrderStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Estado inválido'
        });
        return;
      }

      const order = await Order.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
        return;
      }

      await order.updateStatus(status, req.user?._id.toString());

      res.status(200).json({
        success: true,
        message: 'Estado del pedido actualizado',
        data: order
      });
    } catch (error: any) {
      console.error('Error en updateOrderStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado',
        error: error.message
      });
    }
  }

  /**
   * @desc    Actualizar método de pago
   * @route   PATCH /api/orders/:id/payment
   * @access  Private
   */
  static async updatePaymentMethod(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { paymentMethod, transactionId } = req.body;

      const order = await Order.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
        return;
      }

      // Verificar permisos
      if (req.user?.role === UserRole.CUSTOMER && 
          order.customer.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
        return;
      }

      order.paymentMethod = paymentMethod;
      if (transactionId) order.transactionId = transactionId;
      
      await order.save();

      res.status(200).json({
        success: true,
        message: 'Método de pago actualizado',
        data: order
      });
    } catch (error: any) {
      console.error('Error en updatePaymentMethod:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar método de pago',
        error: error.message
      });
    }
  }

  /**
   * @desc    Calificar pedido
   * @route   POST /api/orders/:id/rating
   * @access  Private/Customer
   */
  static async rateOrder(req: AuthRequest, res: Response): Promise<void> {
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

      const order = await Order.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
        return;
      }

      // Solo el cliente puede calificar su pedido
      if (order.customer.toString() !== req.user?._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para calificar este pedido'
        });
        return;
      }

      // Solo se puede calificar si está entregado
      if (order.status !== OrderStatus.DELIVERED) {
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
    } catch (error: any) {
      console.error('Error en rateOrder:', error);
      res.status(500).json({
        success: false,
        message: 'Error al calificar pedido',
        error: error.message
      });
    }
  }

  /**
   * @desc    Obtener estadísticas del día
   * @route   GET /api/orders/stats/today
   * @access  Private/Admin
   */
  static async getTodayStats(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await Order.getTodayStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error en getTodayStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }

  /**
   * @desc    Cancelar pedido
   * @route   DELETE /api/orders/:id
   * @access  Private
   */
  static async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const order = await Order.findById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
        return;
      }

      // Verificar permisos
      if (req.user?.role === UserRole.CUSTOMER && 
          order.customer.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
        return;
      }

      // Solo se pueden cancelar pedidos pendientes o confirmados
      if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
        res.status(400).json({
          success: false,
          message: 'Solo se pueden cancelar pedidos pendientes o confirmados'
        });
        return;
      }

      await order.updateStatus(OrderStatus.CANCELLED);

      res.status(200).json({
        success: true,
        message: 'Pedido cancelado exitosamente',
        data: order
      });
    } catch (error: any) {
      console.error('Error en cancelOrder:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cancelar pedido',
        error: error.message
      });
    }
  }
}

export default OrderController;