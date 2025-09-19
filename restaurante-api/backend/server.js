require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/database');

// Rutas - comentadas temporalmente para debug
const userRoutes = require('./src/routes/users');
const productRoutes = require('./src/routes/products');
const orderRoutes = require('./src/routes/orders');
const orderItemRoutes = require('./src/routes/orderItems');
const categoryRoutes = require('./src/routes/categories');
const authRoutes = require('./src/routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());
app.use(helmet());

// Conexión a la base de datos
connectDB();

// Endpoints - solo auth por ahora
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);

// Swagger docs
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Ruta raíz
app.get('/', (req, res) => {
  res.send('API Restaurante funcionando');
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});