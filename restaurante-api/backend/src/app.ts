import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';

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
    this.configureErrorHandling();
  }

  /**
   * Configurar middlewares básicos
   */
  private configureMiddlewares(): void {
    // Seguridad
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

    // CORS
    this.app.use(cors());

    // Logging
    this.app.use(morgan('dev'));

    // Body parsers
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * Configurar rutas de la API
   */
  private configureRoutes(): void {
    // Ruta raíz con información útil
    this.app.get('/', (_req: Request, res: Response) => {
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

    // Ruta de salud
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
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
   * Configurar manejo de errores
   */
  private configureErrorHandling(): void {
    // Manejo de errores 404
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        availableEndpoints: '/api/docs'
      });
    });

    // Manejo de errores generales
    this.app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
      });
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