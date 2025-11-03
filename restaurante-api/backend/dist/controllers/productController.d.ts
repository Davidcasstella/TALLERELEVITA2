import { Request, Response } from 'express';
import { AuthRequest } from './authController';
declare class ProductController {
    static getAllProducts(req: Request, res: Response): Promise<void>;
    static getProductById(req: Request, res: Response): Promise<void>;
    static createProduct(req: AuthRequest, res: Response): Promise<void>;
    static updateProduct(req: AuthRequest, res: Response): Promise<void>;
    static deleteProduct(req: AuthRequest, res: Response): Promise<void>;
    static getProductsByCategory(req: Request, res: Response): Promise<void>;
    static getTopRatedProducts(req: Request, res: Response): Promise<void>;
    static getBestSellers(req: Request, res: Response): Promise<void>;
    static getProductsByDietaryPreferences(req: Request, res: Response): Promise<void>;
    static bulkUpdateAvailability(req: AuthRequest, res: Response): Promise<void>;
    static getProductStats(_req: AuthRequest, res: Response): Promise<void>;
}
export default ProductController;
//# sourceMappingURL=productController.d.ts.map