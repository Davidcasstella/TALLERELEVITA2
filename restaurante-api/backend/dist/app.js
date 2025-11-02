"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const categories_1 = __importDefault(require("./routes/categories"));
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const orderItems_1 = __importDefault(require("./routes/orderItems"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.configureMiddlewares();
        this.configureRoutes();
        this.configureErrorHandling();
    }
    configureMiddlewares() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: [
                        "'self'",
                        "'unsafe-inline'",
                        "'unsafe-eval'",
                        "https://unpkg.com",
                        "https://cdnjs.cloudflare.com"
                    ],
                    styleSrc: [
                        "'self'",
                        "'unsafe-inline'",
                        "https://unpkg.com",
                        "https://cdnjs.cloudflare.com"
                    ],
                    connectSrc: [
                        "'self'",
                        "https://tallerelevita2-1.onrender.com",
                        "http://localhost:3000"
                    ],
                    imgSrc: [
                        "'self'",
                        "data:",
                        "https:"
                    ],
                    fontSrc: [
                        "'self'",
                        "https://fonts.gstatic.com",
                        "https://cdnjs.cloudflare.com"
                    ]
                }
            }
        }));
        this.app.use((0, cors_1.default)());
        this.app.use((0, morgan_1.default)('dev'));
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
    }
    configureRoutes() {
        this.app.get('/', (_req, res) => {
            res.json({
                message: 'API Restaurante funcionando correctamente',
                documentation: '/api/docs',
                version: '1.0.0',
                endpoints: {
                    authentication: '/api/auth',
                    users: '/api/users',
                    products: '/api/products',
                    orders: '/api/orders',
                    categories: '/api/categories',
                    orderItems: '/api/order-items'
                },
                status: 'OK',
                timestamp: new Date().toISOString()
            });
        });
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });
        this.app.use('/api/auth', auth_1.default);
        this.app.use('/api/users', users_1.default);
        this.app.use('/api/categories', categories_1.default);
        this.app.use('/api/products', products_1.default);
        this.app.use('/api/orders', orders_1.default);
        this.app.use('/api/order-items', orderItems_1.default);
    }
    configureErrorHandling() {
        this.app.use((_req, res) => {
            res.status(404).json({
                success: false,
                message: 'Ruta no encontrada',
                availableEndpoints: '/api/docs'
            });
        });
        this.app.use((error, _req, res, _next) => {
            console.error('Error:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
            });
        });
    }
    getApp() {
        return this.app;
    }
}
exports.default = new App().getApp();
//# sourceMappingURL=app.js.map