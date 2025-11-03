import { Model } from 'mongoose';
import { ICategory } from '../types/interfaces';
interface ICategoryModel extends Model<ICategory> {
    findByName(name: string): Promise<ICategory | null>;
    getActive(): Promise<ICategory[]>;
    getAllWithProductCount(): Promise<any[]>;
    hasProducts(categoryId: string): Promise<boolean>;
    isNameUnique(name: string, excludeId?: string): Promise<boolean>;
    softDelete(categoryId: string): Promise<void>;
    reorder(categoryIds: string[]): Promise<void>;
    getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        withProducts: number;
    }>;
}
declare const Category: ICategoryModel;
export default Category;
//# sourceMappingURL=Category.d.ts.map