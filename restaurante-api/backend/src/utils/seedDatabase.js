require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Modelos
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const seed = async () => {
  await connectDB();

  // ...aquí puedes agregar lógica para crear usuarios, categorías y productos de ejemplo...

  console.log('✅ Seed de la base de datos completado');
  process.exit(0);
};

seed();
