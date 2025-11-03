import swaggerJsdoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Restaurante API RESTful',
      version: '1.0.0',
      description: `
        ## 🍕 Sistema de Gestión de Restaurante
        
        API RESTful completa para la gestión de un restaurante con:
        - 🔐 Autenticación JWT
        - 👥 Gestión de usuarios (clientes, meseros, chefs, admin)  
        - 🏷️ Gestión de categorías de productos
        - 🍽️ Gestión de productos/menú
        - 🛒 Gestión de pedidos
        - 📊 Reportes básicos
        
        ### Roles disponibles:
        - **customer**: Cliente del restaurante
        - **waiter**: Mesero 
        - **chef**: Cocinero
        - **admin**: Administrador del sistema
        
        ### Autenticación:
        La mayoría de endpoints requieren autenticación JWT.
        Use el endpoint \`POST /api/auth/login\` para obtener el token.
      `,
      contact: {
        name: 'Desarrollador',
        email: 'developer@restaurante.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://restaurante-backend-wid2.onrender.com',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese el token JWT obtenido del login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            _id: { type: 'string', description: 'ID único del usuario' },
            name: { type: 'string', description: 'Nombre completo del usuario' },
            email: { type: 'string', format: 'email', description: 'Email único del usuario' },
            phone: { type: 'string', description: 'Teléfono del usuario' },
            address: { type: 'string', description: 'Dirección del usuario' },
            role: { 
              type: 'string', 
              enum: ['customer', 'waiter', 'chef', 'admin'], 
              description: 'Rol del usuario en el sistema' 
            },
            isActive: { type: 'boolean', description: 'Si el usuario está activo' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan@email.com'
            },
            password: {
              type: 'string',
              minLength: 6,
              example: '123456'
            },
            role: {
              type: 'string',
              enum: ['customer', 'waiter', 'chef', 'admin'],
              example: 'customer'
            }
          }
        },
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            _id: { type: 'string', description: 'ID único de la categoría' },
            name: { type: 'string', description: 'Nombre de la categoría' },
            description: { type: 'string', description: 'Descripción de la categoría' },
            icon: { type: 'string', description: 'Icono representativo' },
            sortOrder: { type: 'number', description: 'Orden de clasificación' },
            isActive: { type: 'boolean', description: 'Si la categoría está activa' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          required: ['name', 'price', 'category', 'preparationTime'],
          properties: {
            _id: { type: 'string', description: 'ID único del producto' },
            name: { type: 'string', description: 'Nombre del producto' },
            description: { type: 'string', description: 'Descripción del producto' },
            price: { type: 'number', description: 'Precio del producto' },
            category: { $ref: '#/components/schemas/Category' },
            image: { type: 'string', description: 'URL de la imagen del producto' },
            ingredients: { 
              type: 'array', 
              items: { type: 'string' }, 
              description: 'Lista de ingredientes' 
            },
            preparationTime: { type: 'number', description: 'Tiempo de preparación en minutos' },
            isVegetarian: { type: 'boolean', description: '¿Es vegetariano?' },
            isVegan: { type: 'boolean', description: '¿Es vegano?' },
            isGlutenFree: { type: 'boolean', description: '¿Es libre de gluten?' },
            spicyLevel: { type: 'number', description: 'Nivel de picante (0-5)' },
            isAvailable: { type: 'boolean', description: 'Si el producto está disponible' },
            rating: { type: 'number', description: 'Calificación promedio' },
            reviewCount: { type: 'number', description: 'Cantidad de reseñas' },
            popularity: { type: 'number', description: 'Popularidad' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        OrderDetailed: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del pedido',
              example: '68cf24e42f91a6d70dafec38'
            },
            orderNumber: {
              type: 'string',
              description: 'Número único generado automáticamente',
              example: 'ORD-20250920-003'
            },
            customer: {
              type: 'object',
              properties: {
                _id: { type: 'string', example: '68ccb73c7023180d6b29d705' },
                name: { type: 'string', example: 'Administrador Principal' },
                email: { type: 'string', example: 'admin@restaurant.com' }
              }
            },
            waiter: {
              type: 'object',
              nullable: true,
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                employeeId: { type: 'string' }
              }
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
              example: 'pending'
            },
            tableNumber: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              example: 8
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '68cf24e52f91a6d70dafec3e' },
                  product: {
                    type: 'object',
                    properties: {
                      _id: { type: 'string', example: '68cdf8fbb5bd4faf93afa7b8' },
                      name: { type: 'string', example: 'Pizza Margherita' },
                      description: { 
                        type: 'string', 
                        example: 'Pizza clásica con tomate, mozzarella y albahaca' 
                      },
                      preparationTime: { type: 'integer', example: 15 },
                      isAvailable: { type: 'boolean', example: true }
                    }
                  },
                  quantity: { type: 'integer', example: 2 },
                  unitPrice: { type: 'number', example: 35000 },
                  subtotal: { type: 'number', example: 70000 },
                  specialInstructions: { type: 'string', example: 'con albahaca' },
                  preparationStatus: {
                    type: 'string',
                    enum: ['pending', 'preparing', 'ready', 'served'],
                    example: 'pending'
                  },
                  productSnapshot: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'Pizza Margherita' },
                      description: { type: 'string' },
                      image: { type: 'string', nullable: true },
                      category: { type: 'string', example: '68ccafc40f3db8123b8da581' }
                    }
                  }
                }
              }
            },
            subtotal: { type: 'number', example: 110000 },
            tax: { type: 'number', example: 0 },
            discount: { type: 'number', example: 0 },
            deliveryFee: { type: 'number', example: 0 },
            totalAmount: { type: 'number', example: 110000 },
            paymentMethod: {
              type: 'string',
              enum: ['cash', 'card', 'transfer', 'pending'],
              example: 'cash'
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'failed', 'refunded'],
              example: 'pending'
            },
            notes: { type: 'string', example: 'Para compartir' },
            estimatedPreparationTime: { type: 'integer', example: 30 },
            actualPreparationTime: { type: 'integer', nullable: true, example: null },
            orderDate: { 
              type: 'string', 
              format: 'date-time', 
              example: '2025-09-20T22:04:20.706Z' 
            },
            confirmedAt: { type: 'string', format: 'date-time', nullable: true },
            readyAt: { type: 'string', format: 'date-time', nullable: true },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true },
            cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            remainingTime: { type: 'integer', nullable: true, example: null },
            isDelayed: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        OrderStatusUpdate: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
              description: 'Nuevo estado del pedido',
              example: 'confirmed'
            }
          }
        },
        OrderStats: {
          type: 'object',
          properties: {
            today: {
              type: 'object',
              properties: {
                totalOrders: { type: 'integer', example: 5 },
                totalRevenue: { type: 'number', example: 295000 },
                averageOrderValue: { type: 'number', example: 73750 },
                pendingOrders: { type: 'integer', example: 2 },
                preparingOrders: { type: 'integer', example: 1 },
                completedOrders: { type: 'integer', example: 1 },
                cancelledOrders: { type: 'integer', example: 1 }
              }
            },
            current: {
              type: 'object',
              properties: {
                pendingCount: { type: 'integer', example: 2 },
                preparingCount: { type: 'integer', example: 1 },
                readyCount: { type: 'integer', example: 0 }
              }
            },
            topProducts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Pizza Margherita' },
                  totalQuantity: { type: 'integer', example: 8 },
                  totalRevenue: { type: 'number', example: 280000 }
                }
              }
            }
          }
        },
        Order: {
          type: 'object',
          required: ['customer', 'items'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del pedido'
            },
            orderNumber: {
              type: 'string',
              description: 'Número único del pedido'
            },
            customer: {
              type: 'string',
              description: 'ID del cliente que hizo el pedido'
            },
            waiter: {
              type: 'string',
              description: 'ID del mesero asignado'
            },
            status: {
              type: 'string',
              enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
              description: 'Estado del pedido'
            },
            tableNumber: {
              type: 'number',
              description: 'Número de mesa'
            },
            totalAmount: {
              type: 'number',
              description: 'Monto total del pedido'
            },
            paymentMethod: {
              type: 'string',
              enum: ['cash', 'card', 'transfer'],
              description: 'Método de pago'
            },
            notes: {
              type: 'string',
              description: 'Notas especiales del pedido'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Mensaje de error'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario'
            },
            password: {
              type: 'string',
              description: 'Contraseña del usuario'
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './src/routes/*.ts',
    './src/models/*.ts',
    './dist/routes/*.js',  // Para producción
    './dist/models/*.js'   // Para producción
  ]
};

const specs = swaggerJsdoc(options);
export default specs;