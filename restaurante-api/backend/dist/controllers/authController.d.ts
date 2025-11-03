import { Request, Response } from 'express';
import { IUser } from '../types/interfaces';
import { UserRole } from '../types/enums';
export interface AuthRequest extends Request {
    user?: IUser;
}
interface JWTPayload {
    id: string;
    role: UserRole;
}
declare class AuthService {
    static generateToken(userId: string, role: UserRole): string;
    static verifyToken(token: string): JWTPayload | null;
    static extractTokenFromHeader(authHeader?: string): string | null;
}
declare class AuthController {
    static register(req: Request, res: Response): Promise<void>;
    static login(req: Request, res: Response): Promise<void>;
    static getProfile(req: AuthRequest, res: Response): Promise<void>;
    static updateProfile(req: AuthRequest, res: Response): Promise<void>;
    static changePassword(req: AuthRequest, res: Response): Promise<void>;
    static verifyToken(req: AuthRequest, res: Response): Promise<void>;
    static logout(_req: AuthRequest, res: Response): Promise<void>;
}
export { AuthService };
export default AuthController;
//# sourceMappingURL=authController.d.ts.map