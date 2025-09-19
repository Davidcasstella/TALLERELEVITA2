const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Obtener items de pedidos (principalmente para cocina)
 */
exports.getOrderItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, chef, orderId } = req.query;

    let query = {};

    // Filtrar por estado de preparación
    if (status) {
      query.preparationStatus = status;
    }

    // Filtrar por chef asignado
    if (chef) {
      query.assignedChef = chef;
    }

    // Filtrar por pedido específico
    if (orderId) {
      query.order = orderId;
    }

    // Si es chef, solo ver sus items asignados
    if (req.user.role === 'chef') {
      query.assignedChef = req.user._id;
    }

    const orderItems = await OrderItem.find(query)
      .populate({
        path: 'order',
        select: 'orderNumber tableNumber status orderDate estimatedPreparationTime',
        populate: {
          path: 'customer',
          select: 'name'
        }
      })
      .populate('product', 'name preparationTime image')
      .populate('assignedChef', 'name employeeId')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await OrderItem.countDocuments(query);

    res.json({
      success: true,
      data: {
        orderItems,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener items de pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener item específico por ID
 */
exports.getOrderItemById = async (req, res) => {
  try {
    const orderItem = await OrderItem.findById(req.params.id)
      .populate({
        path: 'order',
        select: 'orderNumber tableNumber status customer',
        populate: {
          path: 'customer',
          select: 'name email'
        }
      })
      .populate('product', 'name description preparationTime image')
      .populate('assignedChef', 'name employeeId');

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: 'Item de pedido no encontrado'
      });
    }

    res.json({
      success: true,
      data: orderItem
    });
  } catch (error) {
    console.error('Error al obtener item de pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Crear nuevo item de pedido (generalmente se hace desde createOrder)
 */
exports.createOrderItem = async (req, res) => {
  try {
    const { order, product, quantity, specialInstructions } = req.body;

    // Verificar que el pedido existe y está en estado modificable
    const orderDoc = await Order.findById(order);
    if (!orderDoc) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    if (!['pending', 'confirmed'].includes(orderDoc.status)) {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden agregar items a pedidos pendientes o confirmados'
      });
    }

    // Verificar que el producto existe y está disponible
    const productDoc = await Product.findById(product);
    if (!productDoc || !productDoc.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Producto no disponible'
      });
    }

    // Crear el item
    const orderItem = new OrderItem({
      order,
      product,
      quantity,
      unitPrice: productDoc.price,
      specialInstructions
    });

    await orderItem.save();

    // Actualizar el pedido agregando el item y recalculando totales
    orderDoc.items.push(orderItem._id);
    orderDoc.subtotal += orderItem.subtotal;
    orderDoc.totalAmount = orderDoc.subtotal;
    await orderDoc.save();

    await orderItem.populate([
      { path: 'product', select: 'name price' },
      { path: 'order', select: 'orderNumber' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Item agregado al pedido exitosamente',
      data: orderItem
    });
  } catch (error) {
    console.error('Error al crear item de pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar item de pedido (principalmente para estado de preparación)
 */
exports.updateOrderItem = async (req, res) => {
  try {
    const { preparationStatus, assignedChef, preparationNotes, quantity, specialInstructions } = req.body;

    const orderItem = await OrderItem.findById(req.params.id);
    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: 'Item de pedido no encontrado'
      });
    }

    // Verificar permisos según el rol
    if (req.user.role === 'chef' && orderItem.assignedChef?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo puede actualizar items asignados a usted'
      });
    }

    // Actualizar estado de preparación
    if (preparationStatus) {
      await orderItem.updatePreparationStatus(preparationStatus, assignedChef || req.user._id);
    }

    // Actualizar otros campos si se proporcionan
    if (assignedChef && ['admin', 'waiter'].includes(req.user.role)) {
      orderItem.assignedChef = assignedChef;
    }

    if (preparationNotes !== undefined) {
      orderItem.preparationNotes = preparationNotes;
    }

    // Solo permitir cambiar cantidad/instrucciones si el pedido aún no está en preparación
    const order = await Order.findById(orderItem.order);
    if (order && ['pending', 'confirmed'].includes(order.status)) {
      if (quantity && quantity !== orderItem.quantity) {
        const oldSubtotal = orderItem.subtotal;
        orderItem.quantity = quantity;
        // El subtotal se recalcula automáticamente en el pre-save
        await orderItem.save();
        
        // Actualizar total del pedido
        const difference = orderItem.subtotal - oldSubtotal;
        order.subtotal += difference;
        order.totalAmount += difference;
        await order.save();
      }

      if (specialInstructions !== undefined) {
        orderItem.specialInstructions = specialInstructions;
      }
    }

    await orderItem.save();

    await orderItem.populate([
      { path: 'product', select: 'name preparationTime' },
      { path: 'assignedChef', select: 'name employeeId' },
      { path: 'order', select: 'orderNumber status' }
    ]);

    res.json({
      success: true,
      message: 'Item actualizado exitosamente',
      data: orderItem
    });
  } catch (error) {
    console.error('Error al actualizar item de pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar item de pedido
 */
exports.deleteOrderItem = async (req, res) => {
  try {
    const orderItem = await OrderItem.findById(req.params.id);
    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: 'Item de pedido no encontrado'
      });
    }

    // Verificar que el pedido permita modificaciones
    const order = await Order.findById(orderItem.order);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido asociado no encontrado'
      });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar items de pedidos pendientes o confirmados'
      });
    }

    // Actualizar totales del pedido
    order.subtotal -= orderItem.subtotal;
    order.totalAmount -= orderItem.subtotal;
    order.items = order.items.filter(item => item.toString() !== orderItem._id.toString());

    // Verificar que el pedido no quede vacío
    if (order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el único item del pedido. Cancele el pedido completo.'
      });
    }

    await order.save();
    await OrderItem.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Item eliminado del pedido exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar item de pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener items pendientes para cocina
 */
exports.getKitchenQueue = async (req, res) => {
  try {
    const pendingItems = await OrderItem.getPendingForKitchen();

    // Agrupar por pedido para mejor visualización
    const grouped = {};
    pendingItems.forEach(item => {
      const orderId = item.order._id.toString();
      if (!grouped[orderId]) {
        grouped[orderId] = {
          orderInfo: item.order,
          items: []
        };
      }
      grouped[orderId].items.push(item);
    });

    const queueData = Object.values(grouped);

    res.json({
      success: true,
      data: {
        totalItems: pendingItems.length,
        orders: queueData
      }
    });
  } catch (error) {
    console.error('Error al obtener cola de cocina:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener items asignados a un chef
 */
exports.getChefItems = async (req, res) => {
  try {
    const chefId = req.params.chefId || req.user._id;

    // Verificar permisos: solo admin/waiter pueden ver items de otros chefs
    if (chefId !== req.user._id.toString() && !['admin', 'waiter'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver items de otros chefs'
      });
    }

    const { status } = req.query;
    const items = await OrderItem.findByChef(chefId, status);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error al obtener items del chef:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getOrderItems: exports.getOrderItems,
  getOrderItemById: exports.getOrderItemById,
  createOrderItem: exports.createOrderItem,
  updateOrderItem: exports.updateOrderItem,
  deleteOrderItem: exports.deleteOrderItem,
  getKitchenQueue: exports.getKitchenQueue,
  getChefItems: exports.getChefItems
};