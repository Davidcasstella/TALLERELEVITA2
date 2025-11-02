"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
class Server {
    constructor() {
        this.port = parseInt(process.env.PORT || '3000', 10);
    }
    async start() {
        try {
            console.log('🔄 Conectando a la base de datos...');
            await database_1.default.connect();
            app_1.default.listen(this.port, () => {
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
        }
        catch (error) {
            console.error('❌ Error iniciando el servidor:', error);
            process.exit(1);
        }
    }
    setupGracefulShutdown() {
        process.on('SIGTERM', async () => {
            console.log('');
            console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
            await database_1.default.disconnect();
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            console.log('');
            console.log('⚠️  SIGINT recibido. Cerrando servidor...');
            await database_1.default.disconnect();
            process.exit(0);
        });
    }
}
const server = new Server();
server.setupGracefulShutdown();
server.start().catch((error) => {
    console.error('💥 Error fatal al iniciar el servidor:', error);
    process.exit(1);
});
exports.default = server;
//# sourceMappingURL=server.js.map