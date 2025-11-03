import { Document, Types } from 'mongoose';
import { UserRole, OrderStatus, PaymentMethod, PaymentStatus, PreparationStatus, ModificationType, DiscountType, SortOrder, ProductSortField } from './enums';
export interface IBaseDocument extends Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export interface IApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: IValidationError[];
}
export interface IValidationError {
    field: string;
    message: string;
    value?: any;
}
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
export interface IUser extends IBaseDocument {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    role: UserRole;
    isActive: boolean;
    passwordChangedAt?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getPublicProfile(): Omit<IUser, 'password'>;
    changedPasswordAfter(JWTTimestamp: number): boolean;
}
export interface IUserRegistration {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    role: UserRole;
}
export interface IUserLogin {
    email: string;
    password: string;
}
export interface IJwtPayload {
    id: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
export interface ICategory extends IBaseDocument {
    name: string;
    description?: string;
    icon?: string;
    sortOrder: number;
    isActive: boolean;
}
export interface ICategoryInput {
    name: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
}
export interface INutritionalInfo {
    calories?: number;
    proteins?: number;
    carbs?: number;
    fats?: number;
    fiber?: number;
}
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
export interface IProductFilters extends IPaginationQuery {
    category?: string;
    available?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: ProductSortField;
}
export interface IModification {
    type: ModificationType;
    item: string;
    additionalCost: number;
}
export interface IItemDiscount {
    type: DiscountType;
    value: number;
    reason?: string;
}
export interface IItemRating {
    score: number;
    comment?: string;
}
export interface IProductSnapshot {
    name: string;
    description?: string;
    image?: string;
    category: Types.ObjectId;
}
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
    updatePreparationStatus(status: PreparationStatus, chefId?: string): Promise<IOrderItem>;
}
export interface IOrderItemInput {
    product: string;
    quantity: number;
    specialInstructions?: string;
}
export interface IDeliveryInfo {
    address?: string;
    phone?: string;
    instructions?: string;
    estimatedTime?: Date;
}
export interface IOrderRating {
    score: number;
    comment?: string;
    ratedAt?: Date;
}
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
    updateStatus(newStatus: OrderStatus, userId?: string): Promise<IOrder>;
    calculateEstimatedTime(): Promise<IOrder>;
}
export interface IOrderInput {
    items: IOrderItemInput[];
    tableNumber: number;
    notes?: string;
    paymentMethod?: PaymentMethod;
}
export interface IOrderStats {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
    preparingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
}
export interface IAuthRequest extends Express.Request {
    user?: IUser;
    token?: string;
}
export interface IAuthResponse {
    success: boolean;
    message: string;
    token: string;
    user: Omit<IUser, 'password'>;
}
export type ObjectIdString = string;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
//# sourceMappingURL=interfaces.d.ts.map