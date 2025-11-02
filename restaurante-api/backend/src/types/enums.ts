/**
 * Enumeraciones del Sistema de Restaurante
 * Centraliza todos los valores constantes para mejor type-safety
 */

/**
 * Roles de usuario en el sistema
 */
export enum UserRole {
  CUSTOMER = 'customer',
  WAITER = 'waiter',
  CHEF = 'chef',
  ADMIN = 'admin'
}

/**
 * Estados de un pedido
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

/**
 * Métodos de pago disponibles
 */
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  PENDING = 'pending'
}

/**
 * Estados de pago
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

/**
 * Estados de preparación de un item individual
 */
export enum PreparationStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served'
}

/**
 * Tipos de modificaciones en un item
 */
export enum ModificationType {
  ADD = 'add',
  REMOVE = 'remove',
  EXTRA = 'extra',
  LESS = 'less',
  SUBSTITUTE = 'substitute'
}

/**
 * Tipos de descuento
 */
export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

/**
 * Campos de ordenamiento disponibles para productos
 */
export enum ProductSortField {
  NAME = 'name',
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  RATING = 'rating',
  POPULARITY = 'popularity'
}

/**
 * Orden de clasificación
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * Niveles de picante (0-5)
 */
export enum SpicyLevel {
  NONE = 0,
  MILD = 1,
  MEDIUM = 2,
  HOT = 3,
  VERY_HOT = 4,
  EXTREMELY_HOT = 5
}

/**
 * Acciones de gestión de menú
 */
export enum MenuAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  AVAILABILITY = 'availability'
}

/**
 * Constantes del sistema
 */
export const CONSTANTS = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TABLE_NUMBER: 100,
  MIN_TABLE_NUMBER: 1,
  MAX_QUANTITY_PER_ITEM: 50,
  MIN_QUANTITY_PER_ITEM: 1,
  MAX_PREPARATION_TIME: 180, // minutos
  MIN_PREPARATION_TIME: 1,
  MAX_PRICE: 999999,
  MIN_PRICE: 0,
  JWT_EXPIRES_IN: '24h',
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
} as const;

/**
 * Mensajes de error comunes
 */
export const ERROR_MESSAGES = {
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
} as const;