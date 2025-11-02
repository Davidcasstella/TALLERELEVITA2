/**
 * Interfaces del Sistema de Restaurante
 * Define la estructura de datos con type-safety completo
 */

import { Document, Types } from 'mongoose';
import {
  UserRole,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PreparationStatus,
  ModificationType,
  DiscountType,
  SortOrder,
  ProductSortField
} from './enums';

// ==================== INTERFACES BASE ====================

/**
 * Interface base para todos los documentos
 */
export interface IBaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface para respuestas API estándar
 */
export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: IValidationError[];
}

/**
 * Interface para errores de validación
 */
export interface IValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Interface para paginación
 */
export interface IPagination {
  currentPage: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: SortOrder;
}

// ==================== USER INTERFACES ====================

/**
 * Interface para el documento de Usuario
 */
export interface IUser extends IBaseDocument {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: UserRole;
  isActive: boolean;
  passwordChangedAt?: Date;
  
  // Métodos del modelo
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): Omit<IUser, 'password'>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
}

/**
 * Interface para registro de usuario
 */
export interface IUserRegistration {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  role: UserRole;
}

/**
 * Interface para login
 */
export interface IUserLogin {
  email: string;
  password: string;
}

/**
 * Interface para el payload del JWT
 */
export interface IJwtPayload {
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ==================== CATEGORY INTERFACES ====================

/**
 * Interface para el documento de Categoría
 */
export interface ICategory extends IBaseDocument {
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Interface para crear/actualizar categoría
 */
export interface ICategoryInput {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ==================== PRODUCT INTERFACES ====================

/**
 * Interface para información nutricional
 */
export interface INutritionalInfo {
  calories?: number;
  proteins?: number;
  carbs?: number;
  fats?: number;
  fiber?: number;
}

/**
 * Interface para el documento de Producto
 */
export interface IProduct extends IBaseDocument {
  name: string;
  description?: string;
  price: number;
  category: Types.ObjectId | ICategory;
  ingredients: string[];
  preparationTime: number;
  image?: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spicyLevel: number;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  popularity: number;
  nutritionalInfo?: INutritionalInfo;
}

/**
 * Interface para crear/actualizar producto
 */
export interface IProductInput {
  name: string;
  description?: string;
  price: number;
  category: string;
  ingredients?: string[] | string;
  preparationTime: number;
  image?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spicyLevel?: number;
  isAvailable?: boolean;
}

/**
 * Interface para filtros de búsqueda de productos
 */
export interface IProductFilters extends IPaginationQuery {
  category?: string;
  available?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortField;
}

// ==================== ORDER ITEM INTERFACES ====================

/**
 * Interface para modificación de un item
 */
export interface IModification {
  type: ModificationType;
  item: string;
  additionalCost: number;
}

/**
 * Interface para descuento de un item
 */
export interface IItemDiscount {
  type: DiscountType;
  value: number;
  reason?: string;
}

/**
 * Interface para rating de un item
 */
export interface IItemRating {
  score: number;
  comment?: string;
}

/**
 * Interface para snapshot del producto
 */
export interface IProductSnapshot {
  name: string;
  description?: string;
  image?: string;
  category: Types.ObjectId;
}

/**
 * Interface para el documento de OrderItem
 */
export interface IOrderItem extends IBaseDocument {
  order: Types.ObjectId | IOrder;
  product: Types.ObjectId | IProduct;
  productSnapshot: IProductSnapshot;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string;
  modifications: IModification[];
  preparationStatus: PreparationStatus;
  preparationNotes?: string;
  assignedChef?: Types.ObjectId | IUser;
  startedPreparingAt?: Date;
  finishedPreparingAt?: Date;
  servedAt?: Date;
  discount?: IItemDiscount;
  itemRating?: IItemRating;
  totalNutritionalInfo?: INutritionalInfo;
  
  // Métodos
  updatePreparationStatus(status: PreparationStatus, chefId?: string): Promise<IOrderItem>;
}

/**
 * Interface para crear un item de pedido
 */
export interface IOrderItemInput {
  product: string;
  quantity: number;
  specialInstructions?: string;
}

// ==================== ORDER INTERFACES ====================

/**
 * Interface para información de delivery
 */
export interface IDeliveryInfo {
  address?: string;
  phone?: string;
  instructions?: string;
  estimatedTime?: Date;
}

/**
 * Interface para rating de pedido
 */
export interface IOrderRating {
  score: number;
  comment?: string;
  ratedAt?: Date;
}

/**
 * Interface para el documento de Order
 */
export interface IOrder extends IBaseDocument {
  orderNumber: string;
  customer: Types.ObjectId | IUser;
  waiter?: Types.ObjectId | IUser;
  items: Types.ObjectId[] | IOrderItem[];
  status: OrderStatus;
  tableNumber: number;
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  notes?: string;
  customerNotes?: string;
  kitchenNotes?: string;
  deliveryInfo?: IDeliveryInfo;
  orderDate: Date;
  confirmedAt?: Date;
  preparedAt?: Date;
  readyAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  estimatedPreparationTime?: number;
  actualPreparationTime?: number;
  rating?: IOrderRating;
  
  // Métodos
  updateStatus(newStatus: OrderStatus, userId?: string): Promise<IOrder>;
  calculateEstimatedTime(): Promise<IOrder>;
}

/**
 * Interface para crear un pedido
 */
export interface IOrderInput {
  items: IOrderItemInput[];
  tableNumber: number;
  notes?: string;
  paymentMethod?: PaymentMethod;
}

/**
 * Interface para estadísticas de pedidos
 */
export interface IOrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  preparingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

// ==================== REQUEST/RESPONSE INTERFACES ====================

/**
 * Interface para Request extendido con usuario autenticado
 */
export interface IAuthRequest extends Express.Request {
  user?: IUser;
  token?: string;
}

/**
 * Interface para respuesta de login/registro
 */
export interface IAuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: Omit<IUser, 'password'>;
}

// ==================== EXPORT DE TIPOS ÚTILES ====================

export type ObjectIdString = string;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};