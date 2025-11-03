import { Response, NextFunction } from 'express';
import { AuthRequest } from '../controllers/authController';
import { UserRole } from '../types/enums';
interface RoleCondition {
    check: (req: AuthRequest) => boolean;
    allowedRoles: UserRole[];
}
declare class RoleMiddleware {
    static requireRole(...allowedRoles: UserRole[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
    static requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
    static requireEmployee(req: AuthRequest, res: Response, next: NextFunction): void;
    static requireCustomer(req: AuthRequest, res: Response, next: NextFunction): void;
    static requireKitchenStaff(req: AuthRequest, res: Response, next: NextFunction): void;
    static requireWaiterOrAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
    static conditionalRole(conditions: RoleCondition[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
    static requireOrderAccess(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static requireMenuManagement(action: 'view' | 'create' | 'update' | 'delete' | 'availability'): (req: AuthRequest, res: Response, next: NextFunction) => void;
    static logRoleAction(action: string): (req: AuthRequest, _res: Response, next: NextFunction) => void;
    static requireRoleHierarchy(req: AuthRequest, res: Response, next: NextFunction): void;
}
export default RoleMiddleware;
export declare const requireRole: typeof RoleMiddleware.requireRole;
export declare const requireAdmin: typeof RoleMiddleware.requireAdmin;
export declare const requireEmployee: typeof RoleMiddleware.requireEmployee;
export declare const requireCustomer: typeof RoleMiddleware.requireCustomer;
export declare const requireKitchenStaff: typeof RoleMiddleware.requireKitchenStaff;
export declare const requireWaiterOrAdmin: typeof RoleMiddleware.requireWaiterOrAdmin;
export declare const conditionalRole: typeof RoleMiddleware.conditionalRole;
export declare const requireOrderAccess: typeof RoleMiddleware.requireOrderAccess;
export declare const requireMenuManagement: typeof RoleMiddleware.requireMenuManagement;
export declare const requireRoleHierarchy: typeof RoleMiddleware.requireRoleHierarchy;
export declare const logRoleAction: typeof RoleMiddleware.logRoleAction;
export declare const admin: typeof RoleMiddleware.requireAdmin;
export declare const employee: typeof RoleMiddleware.requireEmployee;
export declare const customer: typeof RoleMiddleware.requireCustomer;
export declare const kitchen: typeof RoleMiddleware.requireKitchenStaff;
export declare const waiter: typeof RoleMiddleware.requireWaiterOrAdmin;
//# sourceMappingURL=roleMiddleware.d.ts.map