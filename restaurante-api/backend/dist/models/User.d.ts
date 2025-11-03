import { Model } from 'mongoose';
import { IUser } from '../types/interfaces';
import { UserRole } from '../types/enums';
interface IUserModel extends Model<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    findByIdWithPassword(id: string): Promise<IUser | null>;
    getActiveUsers(role?: UserRole): Promise<IUser[]>;
    validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
    softDelete(userId: string): Promise<boolean>;
    countByRole(): Promise<Record<UserRole, number>>;
}
declare const User: IUserModel;
export default User;
//# sourceMappingURL=User.d.ts.map