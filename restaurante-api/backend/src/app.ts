import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger';

// Rutas
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import orderItemRoutes from './routes/orderItems';

/**
 * Configuración de la aplicación Express
 */
class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureSwagger();
    this.configureErrorHandling();
  }

  /**
   * Configurar middlewares básicos
   */
  private configureMiddlewares(): void {
    // Seguridad con Helmet
    this.app.use(helmet({
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
            "https://frontendtallerelectivaiiria-o.onrender.com",
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

    // CORS - Permitir todas las solicitudes
        this.app.use(cors({
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization']
        }));

    // Logging de peticiones HTTP
    this.app.use(morgan('dev'));

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Archivos estáticos (si tienes carpeta public)
    this.app.use(express.static('public'));
  }

  /**
   * Configurar rutas de la API
   */
  private configureRoutes(): void {
    // Ruta raíz con información útil
    this.app.get('/', (_req: Request, res: Response) => {
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

    // Ruta de salud
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Rutas de la API
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/categories', categoryRoutes);
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/orders', orderRoutes);
    this.app.use('/api/order-items', orderItemRoutes);
  }

  /**
   * Configurar Swagger UI
   */
  private configureSwagger(): void {
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

    // Ruta de documentación Swagger
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, swaggerOptions));

    // Redirección adicional
    this.app.get('/docs', (_req: Request, res: Response) => {
      res.redirect('/api-docs');
    });
  }

  /**
   * Configurar manejo de errores
   */
  private configureErrorHandling(): void {
    // Manejo de errores 404 - Ruta no encontrada
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        error: 'NOT_FOUND',
        availableEndpoints: '/api-docs',
        timestamp: new Date().toISOString()
      });
    });

    // Manejo de errores generales
    // ✅ SOLUCIÓN: Agregar `: void` al tipo de retorno del handler
    this.app.use((error: Error, _req: Request, res: Response, _next: NextFunction): void => {
      console.error('❌ Error capturado:', error);
      
      // Error de validación de Mongoose
      if (error.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          message: 'Error de validación',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Datos inválidos',
          timestamp: new Date().toISOString()
        });
        return; // ✅ Agregar return explícito
      }

      // Error de Cast de Mongoose (ID inválido)
      if (error.name === 'CastError') {
        res.status(400).json({
          success: false,
          message: 'ID inválido',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Formato de ID incorrecto',
          timestamp: new Date().toISOString()
        });
        return; // ✅ Agregar return explícito
      }

      // Error genérico
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
        timestamp: new Date().toISOString()
      });
      // ✅ Ya no necesita return aquí porque es la última instrucción
    });
  }

  /**
   * Obtener la instancia de Express
   */
  public getApp(): Application {
    return this.app;
  }
}

export default new App().getApp();