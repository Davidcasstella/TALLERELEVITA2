"use strict";
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const seed = async () => {
    await connectDB();
    console.log('✅ Seed de la base de datos completado');
    process.exit(0);
};
seed();
//# sourceMappingURL=seedDatabase.js.map