import { Request, Response } from 'express';
import { AuthRequest } from './authController';
declare class CategoryController {
    static getAllCategories(req: Request, res: Response): Promise<void>;
    static getCategoryById(req: Request, res: Response): Promise<void>;
    static createCategory(req: AuthRequest, res: Response): Promise<void>;
    static updateCategory(req: AuthRequest, res: Response): Promise<void>;
    static deleteCategory(req: AuthRequest, res: Response): Promise<void>;
    static reorderCategories(req: AuthRequest, res: Response): Promise<void>;
    static getCategoryStats(_req: AuthRequest, res: Response): Promise<void>;
}
export default CategoryController;
//# sourceMappingURL=categoryController.d.ts.map