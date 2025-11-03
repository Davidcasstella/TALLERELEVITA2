import { Model } from 'mongoose';
import { IOrderItem } from '../types/interfaces';
import { PreparationStatus } from '../types/enums';
interface IOrderItemModel extends Model<IOrderItem> {
    findByChef(chefId: string, status?: PreparationStatus): Promise<IOrderItem[]>;
    getPendingForKitchen(): Promise<IOrderItem[]>;
    getProductStats(productId: string, startDate?: Date, endDate?: Date): Promise<{
        totalOrdered: number;
        totalRevenue: number;
        averageQuantityPerOrder: number;
        averagePrice: number;
        ordersCount: number;
    }>;
}
declare const OrderItem: IOrderItemModel;
export default OrderItem;
//# sourceMappingURL=OrderItem.d.ts.map