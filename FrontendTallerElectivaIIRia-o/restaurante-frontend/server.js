require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Solo usar morgan en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(cors());

// Configuración optimizada de Helmet para producción
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: [
        "'self'", 
        "https://tallerelevita2-1.onrender.com", 
        "http://localhost:3000"
      ],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Middleware para hacer API_URL disponible en todas las vistas
app.use((req, res, next) => {
  res.locals.API_URL = process.env.API_URL;
  res.locals.NODE_ENV = process.env.NODE_ENV;
  next();
});

// Rutas básicas
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Iniciar Sesión'
  });
});

app.get('/register', (req, res) => {
  res.render('register', { 
    title: 'Registro'
  });
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard'
  });
});

app.get('/products', (req, res) => {
  res.render('products', { 
    title: 'Productos'
  });
});

// Rutas para productos
app.get('/products/new', (req, res) => {
  res.render('product-form', { 
    title: 'Nuevo Producto',
    mode: 'create',
    product: null
  });
});

app.get('/products/edit/:id', (req, res) => {
  res.render('product-form', { 
    title: 'Editar Producto',
    mode: 'edit',
    productId: req.params.id
  });
});

// Rutas para pedidos - ORDEN IMPORTANTE: /orders/new ANTES de /orders
app.get('/orders/new', (req, res) => {
  res.render('order-form', { 
    title: 'Nuevo Pedido'
  });
});

// Agregar ANTES de la ruta /orders
app.get('/orders/edit/:id', (req, res) => {
  res.render('order-edit', { 
    title: 'Editar Pedido',
    orderId: req.params.id
  });
});

app.get('/orders', (req, res) => {
  res.render('orders', { 
    title: 'Pedidos'
  });
});

// Ruta para gestión de usuarios (solo admin)
app.get('/users', (req, res) => {
  res.render('users', { 
    title: 'Gestión de Usuarios'
  });
});

// Rutas para categorías
app.get('/categories/new', (req, res) => {
  res.render('category-form', { 
    title: 'Nueva Categoría',
    mode: 'create'
  });
});

app.get('/categories/edit/:id', (req, res) => {
  res.render('category-form', { 
    title: 'Editar Categoría',
    mode: 'edit',
    categoryId: req.params.id
  });
});

app.get('/categories', (req, res) => {
  res.render('categories', { 
    title: 'Gestión de Categorías'
  });
});

// Health check para Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Frontend is running',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('login', {
    title: 'Página no encontrada',
    error: `La página ${req.url} no existe.`
  });
});

// Manejo de errores generales
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).render('login', {
    title: 'Error del servidor',
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Frontend servidor escuchando en puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API URL: ${process.env.API_URL}`);
});