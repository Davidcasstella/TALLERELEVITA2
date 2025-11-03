/**
 * INTERFACES DEL FRONTEND - Coinciden con el backend TypeScript
 * Estas interfaces aseguran type-safety en las respuestas del API
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum UserRole {
  ADMIN = 'admin',
  CHEF = 'chef',
  WAITER = 'waiter',
  CUSTOMER = 'customer'
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer'
}

// ============================================================================
// USER INTERFACES
// ============================================================================

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUserRegister {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// ============================================================================
// PRODUCT INTERFACES
// ============================================================================

export interface IProduct {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string | ICategory;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spicyLevel?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IProductCreate {
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spicyLevel?: number;
}

// ============================================================================
// CATEGORY INTERFACES
// ============================================================================

export interface ICategory {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICategoryCreate {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================================================
// ORDER INTERFACES
// ============================================================================

export interface IOrderItem {
  _id?: string;
  product: string | IProduct;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface IOrder {
  _id: string;
  orderNumber?: string;
  customer: string | IUser;
  items: IOrderItem[];
  tableNumber: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IOrderCreate {
  items: IOrderItem[];
  tableNumber: number;
  paymentMethod: PaymentMethod;
  total: number;
  notes?: string;
}

export interface IOrderUpdate {
  items?: IOrderItem[];
  tableNumber?: number;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  total?: number;
  notes?: string;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ILoginResponse {
  token: string;
  user: IUser;
}

export interface IPaginationData<T> {
  orders?: T[];
  products?: T[];
  categories?: T[];
  users?: T[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

export interface IOrderFilters {
  status?: OrderStatus;
  tableNumber?: number;
  page?: number;
  limit?: number;
  search?: string;
}

export interface IProductFilters {
  category?: string;
  available?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// ============================================================================
// LOCAL STORAGE INTERFACES
// ============================================================================

export interface IStoredUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface ILocalStorage {
  authToken: string | null;
  currentUser: IStoredUser | null;
}