"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
class Database {
    static async connect() {
        try {
            const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurante';
            await mongoose_1.default.connect(mongoURI);
            console.log('✅ MongoDB conectado exitosamente');
            console.log(`📊 Base de datos: ${mongoose_1.default.connection.name}`);
            console.log(`🔗 Host: ${mongoose_1.default.connection.host}`);
        }
        catch (error) {
            console.error('❌ Error conectando a MongoDB:', error);
            process.exit(1);
        }
    }
    static async disconnect() {
        try {
            await mongoose_1.default.disconnect();
            console.log('🔌 MongoDB desconectado');
        }
        catch (error) {
            console.error('❌ Error desconectando de MongoDB:', error);
        }
    }
    static setupConnectionEvents() {
        mongoose_1.default.connection.on('connected', () => {
            console.log('🔗 Mongoose conectado a MongoDB');
        });
        mongoose_1.default.connection.on('error', (err) => {
            console.error('❌ Error en Mongoose:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('🔌 Mongoose desconectado');
        });
        process.on('SIGINT', async () => {
            await Database.disconnect();
            process.exit(0);
        });
    }
}
Database.setupConnectionEvents();
exports.default = Database;
//# sourceMappingURL=database.js.map