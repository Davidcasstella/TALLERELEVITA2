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
  price?: number;
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
  total?: number;
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
        Order.countDocuments(query)
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

      const order = await Order.findById(id)
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
    console.log('🔵 Iniciando creación de pedido...');
    console.log('📦 Usuario autenticado:', req.user);
    console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderData: CreateOrderRequest = req.body;
      const { items, tableNumber, notes, customerNotes, paymentMethod } = orderData;

      // Validar que el usuario esté autenticado
      if (!req.user || !req.user._id) {
        console.error('❌ Usuario no autenticado');
        await session.abortTransaction();
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
        return;
      }

      // Validaciones básicas
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

      // Crear order items y calcular total
      const orderItems: any[] = [];
      let subtotal = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`📦 Procesando item ${i + 1}:`, item);

        // Validar que el item tenga producto
        if (!item.product) {
          console.error(`❌ Item ${i + 1} no tiene producto`);
          await session.abortTransaction();
          res.status(400).json({
            success: false,
            message: `Item ${i + 1} no tiene producto asociado`
          });
          return;
        }

        const product = await Product.findById(item.product);

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

        // Validar cantidad
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

      // Calcular totales
      const tax = subtotal * 0.19; // 19% IVA
      const totalAmount = subtotal + tax;

      console.log('💰 Cálculos finales:');
      console.log('   Subtotal:', subtotal);
      console.log('   IVA (19%):', tax);
      console.log('   Total:', totalAmount);

      // Crear pedido
      const orderDoc: Partial<IOrder> = {
        orderNumber: `ORD-${Date.now()}`,
        customer: req.user._id as any,
        tableNumber,
        subtotal,
        tax,
        totalAmount,
        paymentMethod: paymentMethod as any || 'pending',
        notes: notes || '',
        customerNotes: customerNotes || '',
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING
      };

      console.log('📝 Creando documento de pedido...');
      const [order] = await Order.create([orderDoc], { session });
      console.log('✅ Pedido creado con ID:', order._id);

      // Crear order items y asociarlos
      console.log('📝 Creando items del pedido...');
      const createdItems = await Promise.all(
        orderItems.map(itemData =>
          OrderItem.create([{ ...itemData, order: order._id }], { session })
        )
      );
      console.log('✅ Items creados:', createdItems.length);

      // Actualizar order con los items
      order.items = createdItems.map(([item]) => item._id) as any;
      await order.save({ session });
      console.log('✅ Pedido actualizado con items');

      // ✅ COMENTAR calculateEstimatedTime si no existe en tu modelo
      // Si tienes el método, descomenta la siguiente línea:
      // await order.calculateEstimatedTime();
      console.log('⏭️  Saltando calculateEstimatedTime (no implementado)');

      // Incrementar popularidad de productos
      console.log('📈 Actualizando popularidad de productos...');
      await Promise.all(
        items.map(item =>
          Product.findByIdAndUpdate(item.product, { $inc: { popularity: item.quantity } })
        )
      );

      await session.commitTransaction();
      console.log('✅ Transacción completada exitosamente');

      // Obtener el pedido completo con populate
      const fullOrder = await Order.findById(order._id)
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
    } catch (error: any) {
      await session.abortTransaction();
      console.error('❌ ERROR COMPLETO en createOrder:', error);
      console.error('❌ Stack:', error.stack);
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
   * @desc    Actualizar pedido completo
   * @route   PUT /api/orders/:id
   * @access  Private/Waiter/Admin
   */
  static async updateOrder(req: AuthRequest, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const { items, tableNumber, notes, paymentMethod, status } = req.body;

      const order = await Order.findById(id);

      if (!order) {
        await session.abortTransaction();
        res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
        return;
      }

      // Verificar permisos
      if (req.user?.role === UserRole.CUSTOMER && 
          order.customer.toString() !== req.user._id.toString()) {
        await session.abortTransaction();
        res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
        return;
      }

      // Si hay items nuevos, eliminar los antiguos y crear nuevos
      if (items && Array.isArray(items)) {
        await OrderItem.deleteMany({ order: order._id }, { session });

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

        const createdItems = await OrderItem.create(orderItems, { session });
        
        const tax = subtotal * 0.19;
        const totalAmount = subtotal + tax;

        order.items = createdItems.map(item => item._id) as any;
        order.subtotal = subtotal;
        order.tax = tax;
        order.totalAmount = totalAmount;
      }

      // Actualizar otros campos
      if (tableNumber !== undefined) order.tableNumber = tableNumber;
      if (notes !== undefined) order.notes = notes;
      if (paymentMethod !== undefined) order.paymentMethod = paymentMethod;
      if (status !== undefined) order.status = status;

      await order.save({ session });
      await session.commitTransaction();

      const updatedOrder = await Order.findById(order._id)
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
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Error en updateOrder:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar pedido',
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

      // Si el modelo tiene el método updateStatus, usarlo
      if (typeof order.updateStatus === 'function') {
        await order.updateStatus(status, req.user?._id.toString());
      } else {
        // Si no, actualizar manualmente
        order.status = status;
        await order.save();
      }

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

      if (order.customer.toString() !== req.user?._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'No autorizado para calificar este pedido'
        });
        return;
      }

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
      // Si el modelo tiene el método, usarlo
      if (typeof Order.getTodayStats === 'function') {
        const stats = await Order.getTodayStats();
        res.status(200).json({
          success: true,
          data: stats
        });
      } else {
        // Implementación básica
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const count = await Order.countDocuments({
          createdAt: { $gte: today }
        });
        
        res.status(200).json({
          success: true,
          data: { todayOrders: count }
        });
      }
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

      if (req.user?.role === UserRole.CUSTOMER && 
          order.customer.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
        return;
      }

      if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
        res.status(400).json({
          success: false,
          message: 'Solo se pueden cancelar pedidos pendientes o confirmados'
        });
        return;
      }

      if (typeof order.updateStatus === 'function') {
        await order.updateStatus(OrderStatus.CANCELLED);
      } else {
        order.status = OrderStatus.CANCELLED;
        await order.save();
      }

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