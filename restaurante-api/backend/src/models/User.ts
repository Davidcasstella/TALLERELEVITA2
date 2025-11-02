import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types/interfaces';
import { UserRole, CONSTANTS, ERROR_MESSAGES } from '../types/enums';

/**
 * Utilidades para modelos
 */
class ModelUtils {
  /**
   * Valida que un email sea único en la base de datos
   */
  static async isEmailUnique(
    email: string, 
    excludeId?: mongoose.Types.ObjectId
  ): Promise<boolean> {
    const query: any = { email: email.toLowerCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await mongoose.model('User').findOne(query);
    return !existing;
  }

  /**
   * Sanitiza strings para prevenir inyecciones
   */
  static sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '');
  }
}

/**
 * Schema de Mongoose para Usuario
 */
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      maxlength: [CONSTANTS.MAX_NAME_LENGTH, `El nombre no puede exceder ${CONSTANTS.MAX_NAME_LENGTH} caracteres`],
      set: (value: string) => ModelUtils.sanitizeString(value)
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [CONSTANTS.MAX_EMAIL_LENGTH, `El email no puede exceder ${CONSTANTS.MAX_EMAIL_LENGTH} caracteres`],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un email válido'
      ],
      validate: {
        validator: async function(this: IUser, email: string): Promise<boolean> {
          return await ModelUtils.isEmailUnique(email, this._id);
        },
        message: 'El email ya está registrado'
      }
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [CONSTANTS.MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${CONSTANTS.MIN_PASSWORD_LENGTH} caracteres`],
      select: false // No incluir en consultas por defecto
    },
    phone: {
      type: String,
      trim: true,
      default: undefined
    },
    address: {
      type: String,
      trim: true,
      default: undefined
    },
    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: 'Rol inválido. Debe ser: ' + Object.values(UserRole).join(', ')
      },
      default: UserRole.CUSTOMER
    },
    isActive: {
      type: Boolean,
      default: true
    },
    passwordChangedAt: {
      type: Date,
      default: undefined
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { 
      virtuals: true,
      transform: function(_doc, ret) {
        delete ret.password;
        return ret;
      }
    },
    toObject: { 
      virtuals: true,
      transform: function(_doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

// ==================== INDICES ====================

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ==================== MIDDLEWARE PRE-SAVE ====================

/**
 * Middleware para hashear contraseña antes de guardar
 */
userSchema.pre<IUser>('save', async function(next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Hash con bcrypt (cost factor 12)
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Middleware para actualizar passwordChangedAt
 */
userSchema.pre<IUser>('save', function(next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  
  // Restar 1 segundo para asegurar que el token se cree después
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ==================== MÉTODOS DE INSTANCIA ====================

/**
 * Compara contraseña ingresada con la hasheada
 */
userSchema.methods.comparePassword = async function(
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Error comparando contraseñas:', error);
    return false;
  }
};

/**
 * Obtiene perfil público del usuario (sin datos sensibles)
 */
userSchema.methods.getPublicProfile = function(this: IUser): Omit<IUser, 'password'> {
  const userObject = this.toObject();
  delete (userObject as any).password;
  return userObject;
};

/**
 * Verifica si la contraseña cambió después del token JWT
 */
userSchema.methods.changedPasswordAfter = function(
  this: IUser,
  JWTTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// ==================== MÉTODOS ESTÁTICOS ====================

/**
 * Clase de servicio para operaciones de Usuario
 * Encapsula lógica de negocio
 */
class UserService {
  /**
   * Busca usuario por email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() }).select('+password') as IUser | null;
  }

  /**
   * Busca usuario por ID incluyendo password
   */
  static async findByIdWithPassword(id: string): Promise<IUser | null> {
    return await User.findById(id).select('+password') as IUser | null;
  }

  /**
   * Obtiene todos los usuarios activos
   */
  static async getActiveUsers(role?: UserRole): Promise<IUser[]> {
    const query: any = { isActive: true };
    if (role) {
      query.role = role;
    }
    return await User.find(query).select('-password');
  }

  /**
   * Valida fortaleza de contraseña
   */
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < CONSTANTS.MIN_PASSWORD_LENGTH) {
      errors.push(`La contraseña debe tener al menos ${CONSTANTS.MIN_PASSWORD_LENGTH} caracteres`);
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una letra minúscula');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Realiza soft-delete de un usuario
   */
  static async softDelete(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();
    
    return true;
  }

  /**
   * Cuenta usuarios por rol
   */
  static async countByRole(): Promise<Record<UserRole, number>> {
    const result = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const counts: any = {
      [UserRole.CUSTOMER]: 0,
      [UserRole.WAITER]: 0,
      [UserRole.CHEF]: 0,
      [UserRole.ADMIN]: 0
    };
    
    result.forEach(item => {
      counts[item._id as UserRole] = item.count;
    });
    
    return counts;
  }
}

// Agregar métodos estáticos al schema
userSchema.statics = Object.assign(userSchema.statics, UserService);

// ==================== MODELO ====================

interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByIdWithPassword(id: string): Promise<IUser | null>;
  getActiveUsers(role?: UserRole): Promise<IUser[]>;
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] };
  softDelete(userId: string): Promise<boolean>;
  countByRole(): Promise<Record<UserRole, number>>;
}

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;