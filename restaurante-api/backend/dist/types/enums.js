"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES = exports.CONSTANTS = exports.MenuAction = exports.SpicyLevel = exports.SortOrder = exports.ProductSortField = exports.DiscountType = exports.ModificationType = exports.PreparationStatus = exports.PaymentStatus = exports.PaymentMethod = exports.OrderStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "customer";
    UserRole["WAITER"] = "waiter";
    UserRole["CHEF"] = "chef";
    UserRole["ADMIN"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PREPARING"] = "preparing";
    OrderStatus["READY"] = "ready";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["CARD"] = "card";
    PaymentMethod["TRANSFER"] = "transfer";
    PaymentMethod["PENDING"] = "pending";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PAID"] = "paid";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PreparationStatus;
(function (PreparationStatus) {
    PreparationStatus["PENDING"] = "pending";
    PreparationStatus["PREPARING"] = "preparing";
    PreparationStatus["READY"] = "ready";
    PreparationStatus["SERVED"] = "served";
})(PreparationStatus || (exports.PreparationStatus = PreparationStatus = {}));
var ModificationType;
(function (ModificationType) {
    ModificationType["ADD"] = "add";
    ModificationType["REMOVE"] = "remove";
    ModificationType["EXTRA"] = "extra";
    ModificationType["LESS"] = "less";
    ModificationType["SUBSTITUTE"] = "substitute";
})(ModificationType || (exports.ModificationType = ModificationType = {}));
var DiscountType;
(function (DiscountType) {
    DiscountType["PERCENTAGE"] = "percentage";
    DiscountType["FIXED"] = "fixed";
})(DiscountType || (exports.DiscountType = DiscountType = {}));
var ProductSortField;
(function (ProductSortField) {
    ProductSortField["NAME"] = "name";
    ProductSortField["PRICE"] = "price";
    ProductSortField["CREATED_AT"] = "createdAt";
    ProductSortField["RATING"] = "rating";
    ProductSortField["POPULARITY"] = "popularity";
})(ProductSortField || (exports.ProductSortField = ProductSortField = {}));
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "asc";
    SortOrder["DESC"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
var SpicyLevel;
(function (SpicyLevel) {
    SpicyLevel[SpicyLevel["NONE"] = 0] = "NONE";
    SpicyLevel[SpicyLevel["MILD"] = 1] = "MILD";
    SpicyLevel[SpicyLevel["MEDIUM"] = 2] = "MEDIUM";
    SpicyLevel[SpicyLevel["HOT"] = 3] = "HOT";
    SpicyLevel[SpicyLevel["VERY_HOT"] = 4] = "VERY_HOT";
    SpicyLevel[SpicyLevel["EXTREMELY_HOT"] = 5] = "EXTREMELY_HOT";
})(SpicyLevel || (exports.SpicyLevel = SpicyLevel = {}));
var MenuAction;
(function (MenuAction) {
    MenuAction["VIEW"] = "view";
    MenuAction["CREATE"] = "create";
    MenuAction["UPDATE"] = "update";
    MenuAction["DELETE"] = "delete";
    MenuAction["AVAILABILITY"] = "availability";
})(MenuAction || (exports.MenuAction = MenuAction = {}));
exports.CONSTANTS = {
    MIN_PASSWORD_LENGTH: 6,
    MAX_NAME_LENGTH: 50,
    MAX_EMAIL_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_TABLE_NUMBER: 100,
    MIN_TABLE_NUMBER: 1,
    MAX_QUANTITY_PER_ITEM: 50,
    MIN_QUANTITY_PER_ITEM: 1,
    MAX_PREPARATION_TIME: 180,
    MIN_PREPARATION_TIME: 1,
    MAX_PRICE: 999999,
    MIN_PRICE: 0,
    JWT_EXPIRES_IN: '24h',
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
};
exports.ERROR_MESSAGES = {
    UNAUTHORIZED: 'No autorizado',
    FORBIDDEN: 'Acceso denegado',
    NOT_FOUND: 'Recurso no encontrado',
    VALIDATION_ERROR: 'Error de validación',
    INTERNAL_ERROR: 'Error interno del servidor',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    TOKEN_EXPIRED: 'Token expirado',
    TOKEN_INVALID: 'Token inválido',
    USER_NOT_FOUND: 'Usuario no encontrado',
    PRODUCT_NOT_FOUND: 'Producto no encontrado',
    ORDER_NOT_FOUND: 'Pedido no encontrado',
    CATEGORY_NOT_FOUND: 'Categoría no encontrada'
};
//# sourceMappingURL=enums.js.map