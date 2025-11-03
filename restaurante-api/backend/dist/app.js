"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./config/swagger"));
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
        this.configureSwagger();
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
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(express_1.default.static('public'));
    }
    configureRoutes() {
        this.app.get('/', (_req, res) => {
            res.json({
                message: '🍕 API Restaurante funcionando correctamente',
                documentation: '/api-docs',
                version: '2.0.0',
                author: 'David',
                endpoints: {
                    authentication: {
                        login: 'POST /api/auth/login',
                        register: 'POST /api/auth/register',
                        profile: 'GET /api/auth/profile'
                    },
                    users: {
                        list: 'GET /api/users',
                        getById: 'GET /api/users/:id',
                        update: 'PUT /api/users/:id',
                        delete: 'DELETE /api/users/:id'
                    },
                    categories: {
                        list: 'GET /api/categories',
                        create: 'POST /api/categories',
                        getById: 'GET /api/categories/:id',
                        update: 'PUT /api/categories/:id',
                        delete: 'DELETE /api/categories/:id'
                    },
                    products: {
                        list: 'GET /api/products',
                        create: 'POST /api/products',
                        getById: 'GET /api/products/:id',
                        update: 'PUT /api/products/:id',
                        delete: 'DELETE /api/products/:id'
                    },
                    orders: {
                        list: 'GET /api/orders',
                        create: 'POST /api/orders',
                        getById: 'GET /api/orders/:id',
                        update: 'PUT /api/orders/:id',
                        stats: 'GET /api/orders/stats'
                    },
                    orderItems: {
                        list: 'GET /api/order-items',
                        getById: 'GET /api/order-items/:id'
                    }
                },
                status: 'OK',
                timestamp: new Date().toISOString()
            });
        });
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                environment: process.env.NODE_ENV || 'development'
            });
        });
        this.app.use('/api/auth', auth_1.default);
        this.app.use('/api/users', users_1.default);
        this.app.use('/api/categories', categories_1.default);
        this.app.use('/api/products', products_1.default);
        this.app.use('/api/orders', orders_1.default);
        this.app.use('/api/order-items', orderItems_1.default);
    }
    configureSwagger() {
        const swaggerOptions = {
            explorer: true,
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                docExpansion: 'none',
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1
            },
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'Restaurante API - Documentación'
        };
        this.app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, swaggerOptions));
        this.app.get('/docs', (_req, res) => {
            res.redirect('/api-docs');
        });
    }
    configureErrorHandling() {
        this.app.use((_req, res) => {
            res.status(404).json({
                success: false,
                message: 'Ruta no encontrada',
                error: 'NOT_FOUND',
                availableEndpoints: '/api-docs',
                timestamp: new Date().toISOString()
            });
        });
        this.app.use((error, _req, res, _next) => {
            console.error('❌ Error capturado:', error);
            if (error.name === 'ValidationError') {
                res.status(400).json({
                    success: false,
                    message: 'Error de validación',
                    error: process.env.NODE_ENV === 'development' ? error.message : 'Datos inválidos',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            if (error.name === 'CastError') {
                res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                    error: process.env.NODE_ENV === 'development' ? error.message : 'Formato de ID incorrecto',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
                timestamp: new Date().toISOString()
            });
        });
    }
    getApp() {
        return this.app;
    }
}
exports.default = new App().getApp();
//# sourceMappingURL=app.js.map