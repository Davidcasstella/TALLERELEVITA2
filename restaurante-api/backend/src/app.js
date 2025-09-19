const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('❌ Error en Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose desconectado');
});

module.exports = connectDB;