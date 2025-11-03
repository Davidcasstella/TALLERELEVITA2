const express = require('express');
const router = express.Router();


const requireAuth = (req, res, next) => {

  next();
};


router.get('/', (req, res) => {
  res.redirect('/login');
});


router.get('/login', (req, res) => {
  res.render('login', { 
    title: 'Iniciar Sesión',
    error: null 
  });
});


router.get('/register', (req, res) => {
  res.render('register', { 
    title: 'Registro',
    error: null 
  });
});

router.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', { 
    title: 'Dashboard',
    user: null 
  });
});


router.get('/products', requireAuth, (req, res) => {
  res.render('products', { 
    title: 'Productos',
    user: null
  });
});

router.get('/orders', requireAuth, (req, res) => {
  res.render('orders', { 
    title: 'Pedidos',
    user: null
  });
});

router.get('/orders/new', requireAuth, (req, res) => {
  res.render('order-form', { 
    title: 'Nuevo Pedido',
    user: null
  });
});

router.get('/orders/create', requireAuth, (req, res) => {
  res.render('order-form', { 
    title: 'Crear Pedido',
    user: null
  });
});


router.get('/orders/edit/:id', requireAuth, (req, res) => {
  res.render('order-edit', { 
    title: 'Editar Pedido',
    orderId: req.params.id,
    user: null
  });
});

module.exports = router;