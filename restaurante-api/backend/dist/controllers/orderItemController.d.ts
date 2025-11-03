import { Response } from 'express';
import { AuthRequest } from './authController';
declare class OrderItemController {
    static getAllOrderItems(req: AuthRequest, res: Response): Promise<void>;
    static getOrderItemById(req: AuthRequest, res: Response): Promise<void>;
    static updatePreparationStatus(req: AuthRequest, res: Response): Promise<void>;
    static assignChef(req: AuthRequest, res: Response): Promise<void>;
    static getItemsByChef(req: AuthRequest, res: Response): Promise<void>;
    static getPendingForKitchen(_req: AuthRequest, res: Response): Promise<void>;
    static getProductStats(req: AuthRequest, res: Response): Promise<void>;
    static updatePreparationNotes(req: AuthRequest, res: Response): Promise<void>;
    static rateItem(req: AuthRequest, res: Response): Promise<void>;
}
export default OrderItemController;
//# sourceMappingURL=orderItemController.d.ts.map