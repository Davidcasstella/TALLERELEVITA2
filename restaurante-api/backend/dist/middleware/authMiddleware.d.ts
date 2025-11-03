import { Response, NextFunction } from 'express';
import { AuthRequest } from '../controllers/authController';
export interface AuthRequestWithToken extends AuthRequest {
    token?: string;
}
declare class AuthMiddleware {
    static authenticateToken(req: AuthRequestWithToken, res: Response, next: NextFunction): Promise<void>;
    static optionalAuth(req: AuthRequestWithToken, res: Response, next: NextFunction): Promise<void>;
    static requireOwnershipOrAdmin(resourceUserIdField?: string): (req: AuthRequest, res: Response, next: NextFunction) => void;
    static requireSelfOrAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
    static flexibleAuth(req: AuthRequestWithToken, res: Response, next: NextFunction): Promise<void>;
    static logAuthAccess(req: AuthRequest, _res: Response, next: NextFunction): void;
    static checkTokenExpiration(req: AuthRequestWithToken, res: Response, next: NextFunction): void;
}
export default AuthMiddleware;
export declare const authenticateToken: typeof AuthMiddleware.authenticateToken;
export declare const optionalAuth: typeof AuthMiddleware.optionalAuth;
export declare const requireOwnershipOrAdmin: typeof AuthMiddleware.requireOwnershipOrAdmin;
export declare const requireSelfOrAdmin: typeof AuthMiddleware.requireSelfOrAdmin;
export declare const flexibleAuth: typeof AuthMiddleware.flexibleAuth;
export declare const logAuthAccess: typeof AuthMiddleware.logAuthAccess;
export declare const checkTokenExpiration: typeof AuthMiddleware.checkTokenExpiration;
export declare const auth: typeof AuthMiddleware.authenticateToken;
export declare const protect: typeof AuthMiddleware.authenticateToken;
//# sourceMappingURL=authMiddleware.d.ts.map