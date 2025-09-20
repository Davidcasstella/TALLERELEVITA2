const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const OrderItem = require('../models/OrderItem');

/**
 * Crear un nuevo pedido
 */
// Reemplaza solo el método createOrder con este fix temporal:
exports.createOrder = async (req, res) => {
  try {
    const { items, tableNumber, notes, paymentMethod } = req.body;

    // Validar que todos los productos existan y estén disponibles
    let subtotal = 0;
    const validatedItems = [];

    // Primero validar todos los productos
    for (const item of items) {
      const product = await Product.findById(item.product).populate('category');
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Producto con ID ${item.product} no encontrado`
        });
      }

      if (!product.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `El producto "${product.name}" no está disponible actualmente`
        });
      }

      const itemSubtotal = item.quantity * product.price;
      subtotal += itemSubtotal;

      validatedItems.push({
        ...item,
        product: product,
        unitPrice: product.price,
        subtotal: itemSubtotal
      });
    }

    // GENERAR ORDERNUMBER MANUALMENTE (fix temporal)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Buscar el último pedido del día
    const lastOrder = await Order.findOne({
      orderNumber: new RegExp(`^ORD-${dateStr}-`)
    }).sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    const orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(3, '0')}`;

    // Crear la orden con orderNumber explícito
    const newOrder = new Order({
      orderNumber: orderNumber, // Asignar manualmente
      customer: req.user._id,
      items: [], // Inicialmente vacío
      tableNumber,
      notes,
      paymentMethod: paymentMethod || 'pending',
      subtotal: subtotal,
      totalAmount: subtotal
    });

    await newOrder.save();

    // Crear los OrderItems
    const orderItemIds = [];
    
    for (const validatedItem of validatedItems) {
      const orderItem = new OrderItem({
        order: newOrder._id,
        product: validatedItem.product._id,
        productSnapshot: {
          name: validatedItem.product.name,
          description: validatedItem.product.description,
          image: validatedItem.product.image,
          category: validatedItem.product.category._id
        },
        quantity: validatedItem.quantity,
        unitPrice: validatedItem.unitPrice,
        subtotal: validatedItem.subtotal,
        specialInstructions: validatedItem.specialInstructions || null
      });

      await orderItem.save();
      orderItemIds.push(orderItem._id);
    }

    // Actualizar la orden con los items
    newOrder.items = orderItemIds;
    await newOrder.save();

    // Calcular tiempo estimado
    await newOrder.calculateEstimatedTime();

    // Poblar datos para respuesta
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('customer', 'name email phone')
      .populate('items');

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: populatedOrder
    });

  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener listado de pedidos (con filtros y paginación)
 */
exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'orderDate', order = 'desc' } = req.query;

    let query = {};

    // Si es cliente, solo ver sus propios pedidos
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }

    // Filtros adicionales
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.tableNumber) {
      query.tableNumber = req.query.tableNumber;
    }

    // Si es empleado, puede filtrar por fecha
    if (['waiter', 'chef', 'admin'].includes(req.user.role)) {
      if (req.query.startDate && req.query.endDate) {
        query.orderDate = {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate)
        };
      }
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('waiter', 'name employeeId')
      .populate({
        path: 'items',
        populate: {
          path: 'product',
          select: 'name price image'
        }
      })
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener detalle de un pedido por ID
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('waiter', 'name employeeId')
      .populate({
        path: 'items',
        populate: {
          path: 'product',
          select: 'name price image category preparationTime'
        }
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error al obtener pedido por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar un pedido completo
 */
exports.updateOrder = async (req, res) => {
  try {
    const { items, tableNumber, notes, paymentMethod } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Solo permitir actualización si está en estado 'pending'
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden modificar pedidos en estado pendiente'
      });
    }

    // Actualizar campos básicos
    if (tableNumber) order.tableNumber = tableNumber;
    if (notes !== undefined) order.notes = notes;
    if (paymentMethod) order.paymentMethod = paymentMethod;

    // Si se actualizan items, recalcular todo
    if (items && items.length > 0) {
      // Eliminar items anteriores
      await OrderItem.deleteMany({ _id: { $in: order.items } });

      // Crear nuevos items
      const newOrderItems = [];
      let newSubtotal = 0;

      for (const item of items) {
        const product = await Product.findById(item.product).populate('category');
        
        if (!product || !product.isAvailable) {
          continue; // Saltar productos no disponibles
        }

        // Calcular subtotal del item
        const itemSubtotal = item.quantity * product.price;

        const orderItem = new OrderItem({
          order: order._id,
          product: product._id,
          productSnapshot: {
            name: product.name,
            description: product.description,
            image: product.image,
            category: product.category._id
          },
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal: itemSubtotal,
          specialInstructions: item.specialInstructions || null
        });

        await orderItem.save();
        newOrderItems.push(orderItem._id);
        newSubtotal += itemSubtotal;
      }

      order.items = newOrderItems;
      order.subtotal = newSubtotal;
      order.totalAmount = newSubtotal;
    }

    await order.save();
    await order.calculateEstimatedTime();

    const updatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email')
      .populate('items');

    res.json({
      success: true,
      message: 'Pedido actualizado exitosamente',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar solo el estado del pedido
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Validar transiciones de estado válidas
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['delivered'],
      delivered: [], // Final state
      cancelled: [] // Final state
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de estado "${order.status}" a "${status}"`
      });
    }

    // Actualizar estado usando el método del modelo
    await order.updateStatus(status, req.user._id);

    res.json({
      success: true,
      message: `Estado del pedido actualizado a ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar completamente un pedido (no solo cancelar)
 */
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Restricción: Solo se pueden eliminar pedidos pendientes o cancelados
    if (['preparing', 'ready', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un pedido que está siendo preparado, listo o entregado. Solo pedidos pendientes o cancelados.'
      });
    }

    // Eliminar los OrderItems asociados
    await OrderItem.deleteMany({ _id: { $in: order.items } });

    // Eliminar el pedido completamente
    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Pedido eliminado completamente del sistema',
      deletedOrder: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Nuevo método para cancelar pedido (mantener en el sistema pero cancelado)
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Solo se pueden cancelar pedidos que no estén entregados
    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar un pedido que ya fue entregado'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'El pedido ya está cancelado'
      });
    }

    // Cancelar el pedido usando el método del modelo
    await order.updateStatus('cancelled', req.user._id);

    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      data: order
    });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener estadísticas de pedidos (solo empleados)
 */
exports.getOrderStats = async (req, res) => {
  try {
    const stats = await Order.getTodayStats();
    
    // Estadísticas adicionales
    const pendingCount = await Order.countDocuments({ status: 'pending' });
    const preparingCount = await Order.countDocuments({ status: 'preparing' });
    const readyCount = await Order.countDocuments({ status: 'ready' });

    // Top productos del día
    const topProducts = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'orderInfo'
        }
      },
      {
        $match: {
          'orderInfo.orderDate': {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          },
          'orderInfo.status': { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$subtotal' }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $project: {
          name: { $first: '$productInfo.name' },
          totalQuantity: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        today: stats,
        current: {
          pendingCount,
          preparingCount,
          readyCount
        },
        topProducts
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};