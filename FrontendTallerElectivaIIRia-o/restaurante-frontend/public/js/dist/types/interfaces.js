"use strict";
/**
 * INTERFACES DEL FRONTEND - Coinciden con el backend TypeScript
 * Estas interfaces aseguran type-safety en las respuestas del API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = exports.OrderStatus = exports.UserRole = void 0;
// ============================================================================
// ENUMS
// ============================================================================
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["CHEF"] = "chef";
    UserRole["WAITER"] = "waiter";
    UserRole["CUSTOMER"] = "customer";
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
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
//# sourceMappingURL=interfaces.js.map