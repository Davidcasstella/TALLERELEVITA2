export declare enum UserRole {
    CUSTOMER = "customer",
    WAITER = "waiter",
    CHEF = "chef",
    ADMIN = "admin"
}
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PREPARING = "preparing",
    READY = "ready",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare enum PaymentMethod {
    CASH = "cash",
    CARD = "card",
    TRANSFER = "transfer",
    PENDING = "pending"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum PreparationStatus {
    PENDING = "pending",
    PREPARING = "preparing",
    READY = "ready",
    SERVED = "served"
}
export declare enum ModificationType {
    ADD = "add",
    REMOVE = "remove",
    EXTRA = "extra",
    LESS = "less",
    SUBSTITUTE = "substitute"
}
export declare enum DiscountType {
    PERCENTAGE = "percentage",
    FIXED = "fixed"
}
export declare enum ProductSortField {
    NAME = "name",
    PRICE = "price",
    CREATED_AT = "createdAt",
    RATING = "rating",
    POPULARITY = "popularity"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare enum SpicyLevel {
    NONE = 0,
    MILD = 1,
    MEDIUM = 2,
    HOT = 3,
    VERY_HOT = 4,
    EXTREMELY_HOT = 5
}
export declare enum MenuAction {
    VIEW = "view",
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    AVAILABILITY = "availability"
}
export declare const CONSTANTS: {
    readonly MIN_PASSWORD_LENGTH: 6;
    readonly MAX_NAME_LENGTH: 50;
    readonly MAX_EMAIL_LENGTH: 100;
    readonly MAX_DESCRIPTION_LENGTH: 500;
    readonly MAX_TABLE_NUMBER: 100;
    readonly MIN_TABLE_NUMBER: 1;
    readonly MAX_QUANTITY_PER_ITEM: 50;
    readonly MIN_QUANTITY_PER_ITEM: 1;
    readonly MAX_PREPARATION_TIME: 180;
    readonly MIN_PREPARATION_TIME: 1;
    readonly MAX_PRICE: 999999;
    readonly MIN_PRICE: 0;
    readonly JWT_EXPIRES_IN: "24h";
    readonly DEFAULT_PAGE_SIZE: 10;
    readonly MAX_PAGE_SIZE: 100;
};
export declare const ERROR_MESSAGES: {
    readonly UNAUTHORIZED: "No autorizado";
    readonly FORBIDDEN: "Acceso denegado";
    readonly NOT_FOUND: "Recurso no encontrado";
    readonly VALIDATION_ERROR: "Error de validación";
    readonly INTERNAL_ERROR: "Error interno del servidor";
    readonly INVALID_CREDENTIALS: "Credenciales inválidas";
    readonly TOKEN_EXPIRED: "Token expirado";
    readonly TOKEN_INVALID: "Token inválido";
    readonly USER_NOT_FOUND: "Usuario no encontrado";
    readonly PRODUCT_NOT_FOUND: "Producto no encontrado";
    readonly ORDER_NOT_FOUND: "Pedido no encontrado";
    readonly CATEGORY_NOT_FOUND: "Categoría no encontrada";
};
//# sourceMappingURL=enums.d.ts.map