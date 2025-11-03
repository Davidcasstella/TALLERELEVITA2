import { Model } from 'mongoose';
import { IOrder, IOrderStats } from '../types/interfaces';
interface IOrderModel extends Model<IOrder> {
    getTodayStats(): Promise<IOrderStats>;
}
declare const Order: IOrderModel;
export default Order;
//# sourceMappingURL=Order.d.ts.map