import { Model } from 'mongoose';
import { IProduct, IProductFilters } from '../types/interfaces';
interface IProductModel extends Model<IProduct> {
    findWithFilters(filters: IProductFilters): Promise<{
        products: IProduct[];
        total: number;
        page: number;
        pages: number;
    }>;
    getAvailableByCategory(categoryId: string): Promise<IProduct[]>;
    getTopRated(limit?: number): Promise<IProduct[]>;
    getBestSellers(limit?: number): Promise<IProduct[]>;
    findByDietaryPreferences(preferences: {
        vegetarian?: boolean;
        vegan?: boolean;
        glutenFree?: boolean;
    }): Promise<IProduct[]>;
    bulkUpdateAvailability(productIds: string[], isAvailable: boolean): Promise<void>;
    getStats(): Promise<{
        total: number;
        available: number;
        unavailable: number;
        vegetarian: number;
        vegan: number;
        glutenFree: number;
        averagePrice: number;
        averageRating: number;
    }>;
}
declare const Product: IProductModel;
export default Product;
//# sourceMappingURL=Product.d.ts.map