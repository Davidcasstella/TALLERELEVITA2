import { Response } from 'express';
import { AuthRequest } from './authController';
declare class UserController {
    static getAllUsers(req: AuthRequest, res: Response): Promise<void>;
    static getUserById(req: AuthRequest, res: Response): Promise<void>;
    static createUser(req: AuthRequest, res: Response): Promise<void>;
    static updateUser(req: AuthRequest, res: Response): Promise<void>;
    static deleteUser(req: AuthRequest, res: Response): Promise<void>;
    static getUserStats(_req: AuthRequest, res: Response): Promise<void>;
}
export default UserController;
//# sourceMappingURL=userController.d.ts.map