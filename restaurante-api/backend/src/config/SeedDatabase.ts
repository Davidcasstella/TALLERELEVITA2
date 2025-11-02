import dotenv from 'dotenv';
import Database from '../config/database';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import { UserRole } from '../types/enums';

// Cargar variables de entorno
dotenv.config();

/**
 * Clase SeedDatabase
 * Utilidad para poblar la base de datos con datos de prueba
 */
class SeedDatabase {
  /**
   * Limpiar todas las colecciones
   */
  private static async clearDatabase(): Promise<void> {
    console.log('🗑️  Limpiando base de datos...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('✅ Base de datos limpiada');
  }

  /**
   * Crear usuarios de prueba
   */
  private static async seedUsers(): Promise<void> {
    console.log('👥 Creando usuarios de prueba...');

    const users = [
      {
        name: 'Administrador',
        email: 'admin@restaurant.com',
        password: 'Admin123',
        role: UserRole.ADMIN,
        isActive: true
      },
      {
        name: 'Chef Principal',
        email: 'chef@restaurant.com',
        password: 'Chef123',
        role: UserRole.CHEF,
        isActive: true
      },
      {
        name: 'Mesero 1',
        email: 'waiter@restaurant.com',
        password: 'Waiter123',
        role: UserRole.WAITER,
        isActive: true
      },
      {
        name: 'Cliente Demo',
        email: 'customer@email.com',
        password: 'Customer123',
        role: UserRole.CUSTOMER,
        isActive: true
      }
    ];

    for (const userData of users) {
      await User.create(userData);
    }

    console.log(`✅ ${users.length} usuarios creados`);
  }

  /**
   * Crear categorías de prueba
   */
  private static async seedCategories(): Promise<void> {
    console.log('📁 Creando categorías de prueba...');

    const categories = [
      {
        name: 'Entradas',
        description: 'Platos para comenzar',
        icon: '🥗',
        sortOrder: 1,
        isActive: true
      },
      {
        name: 'Platos Principales',
        description: 'Platos principales del menú',
        icon: '🍽️',
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'Postres',
        description: 'Deliciosos postres caseros',
        icon: '🍰',
        sortOrder: 3,
        isActive: true
      },
      {
        name: 'Bebidas',
        description: 'Bebidas frías y calientes',
        icon: '🥤',
        sortOrder: 4,
        isActive: true
      }
    ];

    for (const categoryData of categories) {
      await Category.create(categoryData);
    }

    console.log(`✅ ${categories.length} categorías creadas`);
  }

  /**
   * Crear productos de prueba
   */
  private static async seedProducts(): Promise<void> {
    console.log('🍕 Creando productos de prueba...');

    // Obtener categorías
    const entradas = await Category.findOne({ name: 'Entradas' });
    const principales = await Category.findOne({ name: 'Platos Principales' });
    const postres = await Category.findOne({ name: 'Postres' });
    const bebidas = await Category.findOne({ name: 'Bebidas' });

    if (!entradas || !principales || !postres || !bebidas) {
      throw new Error('No se encontraron las categorías necesarias');
    }

    const products = [
      // Entradas
      {
        name: 'Ensalada César',
        description: 'Ensalada clásica con pollo, lechuga romana y aderezo césar',
        price: 15000,
        category: entradas._id,
        ingredients: ['lechuga', 'pollo', 'queso parmesano', 'crutones', 'aderezo césar'],
        preparationTime: 10,
        isAvailable: true,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        spicyLevel: 0
      },
      // Platos Principales
      {
        name: 'Pizza Margherita',
        description: 'Pizza clásica con tomate, mozzarella y albahaca',
        price: 25000,
        category: principales._id,
        ingredients: ['masa', 'salsa de tomate', 'mozzarella', 'albahaca'],
        preparationTime: 15,
        isAvailable: true,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        spicyLevel: 0
      },
      {
        name: 'Hamburguesa Clásica',
        description: 'Hamburguesa de carne con lechuga, tomate y queso',
        price: 20000,
        category: principales._id,
        ingredients: ['carne de res', 'pan', 'lechuga', 'tomate', 'queso', 'cebolla'],
        preparationTime: 12,
        isAvailable: true,
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        spicyLevel: 0
      },
      // Postres
      {
        name: 'Tiramisú',
        description: 'Postre italiano con café y mascarpone',
        price: 12000,
        category: postres._id,
        ingredients: ['bizcochos', 'café', 'mascarpone', 'cacao'],
        preparationTime: 5,
        isAvailable: true,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        spicyLevel: 0
      },
      // Bebidas
      {
        name: 'Limonada Natural',
        description: 'Limonada fresca hecha al momento',
        price: 5000,
        category: bebidas._id,
        ingredients: ['limón', 'agua', 'azúcar'],
        preparationTime: 3,
        isAvailable: true,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        spicyLevel: 0
      }
    ];

    for (const productData of products) {
      await Product.create(productData);
    }

    console.log(`✅ ${products.length} productos creados`);
  }

  /**
   * Ejecutar seed completo
   */
  static async run(): Promise<void> {
    try {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║   🌱 INICIANDO SEED DE BASE DE DATOS  ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');

      // Conectar a la base de datos
      await Database.connect();

      // Limpiar base de datos
      await this.clearDatabase();

      // Poblar con datos de prueba
      await this.seedUsers();
      await this.seedCategories();
      await this.seedProducts();

      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log('║   ✅ SEED COMPLETADO EXITOSAMENTE     ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');
      console.log('Credenciales de prueba:');
      console.log('  Admin:    admin@restaurant.com / Admin123');
      console.log('  Chef:     chef@restaurant.com / Chef123');
      console.log('  Mesero:   waiter@restaurant.com / Waiter123');
      console.log('  Cliente:  customer@email.com / Customer123');
      console.log('');

      process.exit(0);
    } catch (error) {
      console.error('❌ Error ejecutando seed:', error);
      process.exit(1);
    }
  }
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  SeedDatabase.run();
}

export default SeedDatabase;