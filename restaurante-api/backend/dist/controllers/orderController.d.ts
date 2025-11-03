import { Response } from 'express';
import { AuthRequest } from './authController';
declare class OrderController {
    static getAllOrders(req: AuthRequest, res: Response): Promise<void>;
    static getOrderById(req: AuthRequest, res: Response): Promise<void>;
    static createOrder(req: AuthRequest, res: Response): Promise<void>;
    static updateOrder(req: AuthRequest, res: Response): Promise<void>;
    static updateOrderStatus(req: AuthRequest, res: Response): Promise<void>;
    static updatePaymentMethod(req: AuthRequest, res: Response): Promise<void>;
    static rateOrder(req: AuthRequest, res: Response): Promise<void>;
    static getTodayStats(_req: AuthRequest, res: Response): Promise<void>;
    static cancelOrder(req: AuthRequest, res: Response): Promise<void>;
}
export default OrderController;
//# sourceMappingURL=orderController.d.ts.map