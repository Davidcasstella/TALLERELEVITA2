"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const enums_1 = require("../types/enums");
class ModelUtils {
    static async isEmailUnique(email, excludeId) {
        const query = { email: email.toLowerCase() };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const existing = await mongoose_1.default.model('User').findOne(query);
        return !existing;
    }
    static sanitizeString(str) {
        return str.trim().replace(/[<>]/g, '');
    }
}
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxlength: [enums_1.CONSTANTS.MAX_NAME_LENGTH, `El nombre no puede exceder ${enums_1.CONSTANTS.MAX_NAME_LENGTH} caracteres`],
        set: (value) => ModelUtils.sanitizeString(value)
    },
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: [enums_1.CONSTANTS.MAX_EMAIL_LENGTH, `El email no puede exceder ${enums_1.CONSTANTS.MAX_EMAIL_LENGTH} caracteres`],
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Por favor ingrese un email válido'
        ],
        validate: {
            validator: async function (email) {
                return await ModelUtils.isEmailUnique(email, this._id);
            },
            message: 'El email ya está registrado'
        }
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: [enums_1.CONSTANTS.MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${enums_1.CONSTANTS.MIN_PASSWORD_LENGTH} caracteres`],
        select: false
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
            values: Object.values(enums_1.UserRole),
            message: 'Rol inválido. Debe ser: ' + Object.values(enums_1.UserRole).join(', ')
        },
        default: enums_1.UserRole.CUSTOMER
    },
    isActive: {
        type: Boolean,
        default: true
    },
    passwordChangedAt: {
        type: Date,
        default: undefined
    }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        virtuals: true,
        transform: function (_doc, ret) {
            delete ret.password;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: function (_doc, ret) {
            delete ret.password;
            return ret;
        }
    }
});
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        this.password = await bcryptjs_1.default.hash(this.password, 12);
        next();
    }
    catch (error) {
        next(error);
    }
});
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }
    this.passwordChangedAt = new Date(Date.now() - 1000);
    next();
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch (error) {
        console.error('Error comparando contraseñas:', error);
        return false;
    }
};
userSchema.methods.getPublicProfile = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};
class UserService {
    static async findByEmail(email) {
        return await User.findOne({ email: email.toLowerCase() }).select('+password');
    }
    static async findByIdWithPassword(id) {
        return await User.findById(id).select('+password');
    }
    static async getActiveUsers(role) {
        const query = { isActive: true };
        if (role) {
            query.role = role;
        }
        return await User.find(query).select('-password');
    }
    static validatePasswordStrength(password) {
        const errors = [];
        if (password.length < enums_1.CONSTANTS.MIN_PASSWORD_LENGTH) {
            errors.push(`La contraseña debe tener al menos ${enums_1.CONSTANTS.MIN_PASSWORD_LENGTH} caracteres`);
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
    static async softDelete(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error(enums_1.ERROR_MESSAGES.USER_NOT_FOUND);
        }
        user.isActive = false;
        user.email = `deleted_${Date.now()}_${user.email}`;
        await user.save();
        return true;
    }
    static async countByRole() {
        const result = await User.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        const counts = {
            [enums_1.UserRole.CUSTOMER]: 0,
            [enums_1.UserRole.WAITER]: 0,
            [enums_1.UserRole.CHEF]: 0,
            [enums_1.UserRole.ADMIN]: 0
        };
        result.forEach(item => {
            counts[item._id] = item.count;
        });
        return counts;
    }
}
userSchema.statics = Object.assign(userSchema.statics, UserService);
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
//# sourceMappingURL=User.js.map