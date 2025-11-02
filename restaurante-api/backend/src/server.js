require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');

// Rutas
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const orderItemRoutes = require('./routes/orderItems');
const categoryRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Configuración especial de Helmet para permitir Swagger
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://unpkg.com",
        "https://cdnjs.cloudflare.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",
        "https://cdnjs.cloudflare.com"
      ],
      connectSrc: [
        "'self'",
        "https://tallerelevita2-1.onrender.com",
        "http://localhost:3000"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ]
    }
  }
}));

// Conexión a la base de datos
connectDB();

// Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);

// Swagger docs
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Configuración personalizada de Swagger
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
};

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerOptions));

// Ruta raíz con información útil
app.get('/', (req, res) => {
  res.json({
    message: 'API Restaurante funcionando correctamente',
    documentation: '/api/docs',
    version: '1.0.0',
    endpoints: {
      authentication: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      categories: '/api/categories',
      orderItems: '/api/order-items'
    },
    status: 'OK'
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Ruta no encontrada',
    availableEndpoints: '/api/docs'
  });
});

// Manejo de errores generales
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`📚 Documentación disponible en http://localhost:${PORT}/api/docs`);
});