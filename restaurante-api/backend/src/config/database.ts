import mongoose from 'mongoose';

/**
 * Clase Database
 * Maneja la conexión a MongoDB con Mongoose
 */
class Database {
  /**
   * Conectar a MongoDB
   */
  static async connect(): Promise<void> {
    try {
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurante';

      await mongoose.connect(mongoURI);

      console.log('✅ MongoDB conectado exitosamente');
      console.log(`📊 Base de datos: ${mongoose.connection.name}`);
      console.log(`🔗 Host: ${mongoose.connection.host}`);
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      process.exit(1);
    }
  }

  /**
   * Desconectar de MongoDB
   */
  static async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('🔌 MongoDB desconectado');
    } catch (error) {
      console.error('❌ Error desconectando de MongoDB:', error);
    }
  }

  /**
   * Configurar eventos de conexión
   */
  static setupConnectionEvents(): void {
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose conectado a MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Error en Mongoose:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose desconectado');
    });

    // Manejar cierre de la aplicación
    process.on('SIGINT', async () => {
      await Database.disconnect();
      process.exit(0);
    });
  }
}

// Configurar eventos al importar el módulo
Database.setupConnectionEvents();

export default Database;