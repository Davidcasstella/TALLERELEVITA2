const swaggerJsdoc = require('swagger-jsdoc');

const options = {
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
        url: 'https://tu-app.render.com',
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
            _id: {
              type: 'string',
              description: 'ID único del usuario'
            },
            name: {
              type: 'string',
              description: 'Nombre completo del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email único del usuario'
            },
            phone: {
              type: 'string',
              description: 'Teléfono del usuario'
            },
            address: {
              type: 'string',
              description: 'Dirección del usuario'
            },
            role: {
              type: 'string',
              enum: ['customer', 'waiter', 'chef', 'admin'],
              description: 'Rol del usuario en el sistema'
            },
            isActive: {
              type: 'boolean',
              description: 'Si el usuario está activo'
            }
          }
        },
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID único de la categoría'
            },
            name: {
              type: 'string',
              description: 'Nombre de la categoría'
            },
            description: {
              type: 'string',
              description: 'Descripción de la categoría'
            },
            isActive: {
              type: 'boolean',
              description: 'Si la categoría está activa'
            }
          }
        },
        Product: {
          type: 'object',
          required: ['name', 'price', 'category'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del producto'
            },
            name: {
              type: 'string',
              description: 'Nombre del producto'
            },
            description: {
              type: 'string',
              description: 'Descripción del producto'
            },
            price: {
              type: 'number',
              description: 'Precio del producto'
            },
            category: {
              type: 'string',
              description: 'ID de la categoría del producto'
            },
            image: {
              type: 'string',
              description: 'URL de la imagen del producto'
            },
            ingredients: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Lista de ingredientes'
            },
            isAvailable: {
              type: 'boolean',
              description: 'Si el producto está disponible'
            },
            preparationTime: {
              type: 'number',
              description: 'Tiempo de preparación en minutos'
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
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js'
  ]
};

const specs = swaggerJsdoc(options);
module.exports = specs;