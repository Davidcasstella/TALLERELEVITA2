"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("../models/User"));
const Category_1 = __importDefault(require("../models/Category"));
const Product_1 = __importDefault(require("../models/Product"));
const enums_1 = require("../types/enums");
dotenv_1.default.config();
class SeedDatabase {
    static async clearDatabase() {
        console.log('🗑️  Limpiando base de datos...');
        await User_1.default.deleteMany({});
        await Category_1.default.deleteMany({});
        await Product_1.default.deleteMany({});
        console.log('✅ Base de datos limpiada');
    }
    static async seedUsers() {
        console.log('👥 Creando usuarios de prueba...');
        const users = [
            {
                name: 'Administrador',
                email: 'admin@restaurant.com',
                password: 'Admin123',
                role: enums_1.UserRole.ADMIN,
                isActive: true
            },
            {
                name: 'Chef Principal',
                email: 'chef@restaurant.com',
                password: 'Chef123',
                role: enums_1.UserRole.CHEF,
                isActive: true
            },
            {
                name: 'Mesero 1',
                email: 'waiter@restaurant.com',
                password: 'Waiter123',
                role: enums_1.UserRole.WAITER,
                isActive: true
            },
            {
                name: 'Cliente Demo',
                email: 'customer@email.com',
                password: 'Customer123',
                role: enums_1.UserRole.CUSTOMER,
                isActive: true
            }
        ];
        for (const userData of users) {
            await User_1.default.create(userData);
        }
        console.log(`✅ ${users.length} usuarios creados`);
    }
    static async seedCategories() {
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
            await Category_1.default.create(categoryData);
        }
        console.log(`✅ ${categories.length} categorías creadas`);
    }
    static async seedProducts() {
        console.log('🍕 Creando productos de prueba...');
        const entradas = await Category_1.default.findOne({ name: 'Entradas' });
        const principales = await Category_1.default.findOne({ name: 'Platos Principales' });
        const postres = await Category_1.default.findOne({ name: 'Postres' });
        const bebidas = await Category_1.default.findOne({ name: 'Bebidas' });
        if (!entradas || !principales || !postres || !bebidas) {
            throw new Error('No se encontraron las categorías necesarias');
        }
        const products = [
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
            await Product_1.default.create(productData);
        }
        console.log(`✅ ${products.length} productos creados`);
    }
    static async run() {
        try {
            console.log('');
            console.log('╔════════════════════════════════════════╗');
            console.log('║   🌱 INICIANDO SEED DE BASE DE DATOS  ║');
            console.log('╚════════════════════════════════════════╝');
            console.log('');
            await database_1.default.connect();
            await this.clearDatabase();
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
        }
        catch (error) {
            console.error('❌ Error ejecutando seed:', error);
            process.exit(1);
        }
    }
}
if (require.main === module) {
    SeedDatabase.run();
}
exports.default = SeedDatabase;
//# sourceMappingURL=SeedDatabase.js.map