import dotenv from 'dotenv';

// Cargar variables de entorno PRIMERO
dotenv.config();

import app from './app';
import Database from './config/database';

/**
 * Clase Server
 * Maneja el inicio del servidor y la configuración inicial
 */
class Server {
  private port: number;

  constructor() {
    this.port = parseInt(process.env.PORT || '3000', 10);
  }

  /**
   * Iniciar el servidor
   */
  async start(): Promise<void> {
    try {
      // 1. Conectar a la base de datos
      console.log('🔄 Conectando a la base de datos...');
      await Database.connect();

      // 2. Iniciar servidor Express
      app.listen(this.port, () => {
        console.log('');
        console.log('╔════════════════════════════════════════════╗');
        console.log('║   🚀 SERVIDOR RESTAURANTE API INICIADO   ║');
        console.log('╚════════════════════════════════════════════╝');
        console.log('');
        console.log(`📍 Puerto: ${this.port}`);
        console.log(`🌍 URL: http://localhost:${this.port}`);
        console.log(`📚 Documentación: http://localhost:${this.port}/api-docs`);
        console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log('');
        console.log('Endpoints disponibles:');
        console.log('  • POST   /api/auth/register');
        console.log('  • POST   /api/auth/login');
        console.log('  • GET    /api/users');
        console.log('  • GET    /api/categories');
        console.log('  • GET    /api/products');
        console.log('  • GET    /api/orders');
        console.log('  • GET    /api/order-items');
        console.log('');
        console.log('✨ Servidor listo para recibir peticiones');
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error iniciando el servidor:', error);
      process.exit(1);
    }
  }

  /**
   * Manejar cierre graceful del servidor
   */
  setupGracefulShutdown(): void {
    process.on('SIGTERM', async () => {
      console.log('');
      console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
      await Database.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('');
      console.log('⚠️  SIGINT recibido. Cerrando servidor...');
      await Database.disconnect();
      process.exit(0);
    });
  }
}

// Crear instancia del servidor
const server = new Server();

// Configurar cierre graceful
server.setupGracefulShutdown();

// Iniciar servidor
server.start().catch((error) => {
  console.error('💥 Error fatal al iniciar el servidor:', error);
  process.exit(1);
});

export default server;