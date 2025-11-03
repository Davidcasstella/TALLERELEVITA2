import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';
import { Model, Document } from 'mongoose';
import { AuthRequest } from '../controllers/authController';
export declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateUserRegistration: ValidationChain[];
export declare const validateUserLogin: ValidationChain[];
export declare const validateUserUpdate: ValidationChain[];
export declare const validateCategory: ValidationChain[];
export declare const validateProduct: ValidationChain[];
export declare const validateOrder: ValidationChain[];
export declare const validateOrderStatus: ValidationChain[];
export declare const validateObjectId: (paramName?: string) => ValidationChain[];
export declare const validateSearchQuery: ValidationChain[];
export declare const validateResourceExists: <T extends Document>(ModelClass: Model<T>, field?: string, paramName?: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validationMiddleware.d.ts.map