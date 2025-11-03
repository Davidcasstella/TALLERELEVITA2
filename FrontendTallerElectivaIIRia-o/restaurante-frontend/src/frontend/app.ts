/**
 * APLICACIÓN FRONTEND EN TYPESCRIPT - VERSIÓN FINAL
 * Sin imports - Wrapped en IIFE - Sin duplicados
 */

(function() {
  'use strict';

  // ============================================================================
  // TYPES & INTERFACES
  // ============================================================================

  enum UserRole {
    ADMIN = 'admin',
    CHEF = 'chef',
    WAITER = 'waiter',
    CUSTOMER = 'customer'
  }

  enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PREPARING = 'preparing',
    READY = 'ready',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
  }

  enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    TRANSFER = 'transfer'
  }

  interface IUser {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }

  interface IProduct {
    _id: string;
    name: string;
    description?: string;
    price: number;
    category: string | any;
    image?: string;
    isAvailable: boolean;
    preparationTime?: number;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    spicyLevel?: number;
  }

  interface ICategory {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
    isActive?: boolean;
    productCount?: number;
  }

  interface IOrderItem {
    _id?: string;
    product: string | IProduct;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }

  interface IOrder {
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

  interface IOrderCreate {
    items: IOrderItem[];
    tableNumber: number;
    paymentMethod: PaymentMethod;
    total: number;
    notes?: string;
  }

  interface IOrderUpdate {
    items?: IOrderItem[];
    tableNumber?: number;
    status?: OrderStatus;
    paymentMethod?: PaymentMethod;
    total?: number;
    notes?: string;
  }

  interface IApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
  }

  interface ILoginResponse {
    token: string;
    user: IUser;
  }

  interface IOrderFilters {
    status?: OrderStatus;
    tableNumber?: number;
    page?: number;
    limit?: number;
    search?: string;
  }

  interface IProductFilters {
    category?: string;
    available?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }

  // ============================================================================
  // CONFIGURACIÓN Y ESTADO GLOBAL
  // ============================================================================

  const API_URL: string = 'https://tallerelevita2-1.onrender.com/api';

  let currentUser: IUser | null = null;
  let authToken: string | null = localStorage.getItem('authToken');

  // ============================================================================
  // FUNCIONES DE UI
  // ============================================================================

  type AlertType = 'error' | 'success' | 'info';

  function showAlert(elementId: string, message: string, type: AlertType = 'error'): void {
    let targetElement: HTMLElement | null = null;
    
    if (typeof elementId === 'string') {
      targetElement = document.getElementById(elementId);
    }
    
    if (!targetElement) {
      createFloatingAlert(message, type);
      return;
    }

    targetElement.textContent = message;
    targetElement.className = `alert alert-${type}`;
    targetElement.classList.remove('hidden');
    
    setTimeout(() => {
      targetElement!.classList.add('hidden');
    }, 5000);
  }

  function createFloatingAlert(message: string, type: AlertType): void {
    const alert: HTMLDivElement = document.createElement('div');
    alert.className = `floating-alert alert-${type}`;
    alert.textContent = message;
    
    const backgroundColor: string = 
      type === 'error' ? '#dc3545' :
      type === 'success' ? '#28a745' :
      '#17a2b8';
    
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      max-width: 350px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      background-color: ${backgroundColor};
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
      alert.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      alert.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(alert)) {
          document.body.removeChild(alert);
        }
      }, 300);
    }, 4000);
  }

  function showLoading(formId: string, show: boolean): void {
    const form: HTMLElement | null = document.getElementById(formId);
    if (form) {
      if (show) {
        form.classList.add('loading');
      } else {
        form.classList.remove('loading');
      }
    }
  }

  // ============================================================================
  // API REQUEST
  // ============================================================================

  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  async function apiRequest<T = any>(
    endpoint: string, 
    method: HttpMethod = 'GET', 
    data: any = null
  ): Promise<IApiResponse<T>> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      } as HeadersInit
    };

    // ✅ Verificar que authToken no sea null antes de usarlo
    if (authToken !== null && authToken !== undefined) {
      (options.headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
    }

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = JSON.stringify(data);
    }

    try {
      const response: Response = await fetch(`${API_URL}${endpoint}`, options);
      const result: IApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error en la petición');
      }

      return result;
    } catch (error) {
      console.error('Error en API:', error);
      throw error;
    }
  }

  // ============================================================================
  // AUTENTICACIÓN
  // ============================================================================

  async function verifyToken(): Promise<boolean> {
    try {
      await apiRequest('/orders?limit=1');
      return true;
    } catch (error) {
      console.log('Token inválido:', (error as Error).message);
      return false;
    }
  }

  function clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
  }

  function displayUserInfo(): void {
    const userInfoElement: HTMLElement | null = document.getElementById('userInfo');
    const userDetailsElement: HTMLElement | null = document.getElementById('userDetails');
    
    if (currentUser && userDetailsElement) {
      userDetailsElement.innerHTML = `
        <p><strong>Nombre:</strong> ${currentUser.name}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Rol:</strong> ${currentUser.role}</p>
      `;
    }

    if (currentUser && userInfoElement) {
      userInfoElement.classList.remove('hidden');
    }
  }

  async function login(credentials: { email: string; password: string }): Promise<void> {
    console.log('🔐 Intentando login con:', credentials.email);
    
    try {
      showLoading('loginForm', true);
      const response: any = await apiRequest('/auth/login', 'POST', credentials);
      
      console.log('✅ Respuesta del servidor:', response);

      // ✅ El backend envía token y user directamente en response (no en response.data)
      const token: string | undefined = response.data?.token || response.token;
      const user: IUser | undefined = response.data?.user || response.user;

      if (token && user) {
        authToken = token;  // ✅ Ya verificado que no es undefined
        currentUser = user;
        localStorage.setItem('authToken', token);  // ✅ Usar la constante local verificada
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        console.log('✅ Token guardado:', token.substring(0, 20) + '...');
        console.log('✅ Usuario guardado:', user);
        
        showAlert('loginAlert', '¡Login exitoso! Redirigiendo...', 'success');
        
        setTimeout(() => {
          console.log('🔄 Redirigiendo a /dashboard');
          window.location.href = '/dashboard';
        }, 500);
      } else {
        console.error('❌ No se encontró token o usuario en la respuesta');
        console.error('Respuesta completa:', JSON.stringify(response, null, 2));
        throw new Error('No se recibió token del servidor');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      showAlert('loginAlert', (error as Error).message || 'Error al iniciar sesión', 'error');
    } finally {
      showLoading('loginForm', false);
    }
  }

  async function register(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<void> {
    console.log('📝 Intentando registro:', userData.email);
    
    try {
      showLoading('registerForm', true);
      const response: any = await apiRequest('/auth/register', 'POST', userData);
      
      console.log('✅ Respuesta del registro:', response);

      // ✅ El backend envía token y user directamente en response (no en response.data)
      const token: string | undefined = response.data?.token || response.token;
      const user: IUser | undefined = response.data?.user || response.user;

      if (token && user) {
        authToken = token;  // ✅ Ya verificado que no es undefined
        currentUser = user;
        localStorage.setItem('authToken', token);  // ✅ Usar la constante local verificada
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        console.log('✅ Registro exitoso, redirigiendo...');
        
        showAlert('registerAlert', '¡Registro exitoso! Redirigiendo...', 'success');
        
        setTimeout(() => {
          console.log('🔄 Redirigiendo a /dashboard');
          window.location.href = '/dashboard';
        }, 500);
      } else {
        throw new Error('No se recibió token del servidor');
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      showAlert('registerAlert', (error as Error).message || 'Error al registrarse', 'error');
    } finally {
      showLoading('registerForm', false);
    }
  }

  async function logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', 'POST');
    } catch (error) {
      console.log('Error en logout del servidor:', error);
    } finally {
      clearAuthData();
      window.location.href = '/login';
    }
  }

  // ============================================================================
  // FUNCIONES DE PEDIDOS
  // ============================================================================

  async function getOrders(filters: IOrderFilters = {}): Promise<IApiResponse<any>> {
    try {
      const params: URLSearchParams = new URLSearchParams();
      
      Object.keys(filters).forEach((key: string) => {
        const value: any = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response: IApiResponse<any> = await apiRequest(`/orders?${params}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
      throw error;
    }
  }

  async function getOrderById(orderId: string): Promise<IApiResponse<IOrder>> {
    try {
      const response: IApiResponse<IOrder> = await apiRequest(`/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo pedido:', error);
      throw error;
    }
  }

  async function createOrder(orderData: IOrderCreate): Promise<IApiResponse<IOrder>> {
    try {
      if (!orderData.total || orderData.total === 0) {
        const calculatedTotal: number = orderData.items.reduce((sum: number, item) => {
          const itemPrice: number = parseFloat(String(item.price)) || 0;
          const itemQuantity: number = parseInt(String(item.quantity)) || 1;
          return sum + (itemPrice * itemQuantity);
        }, 0);
        
        orderData.total = calculatedTotal;
        console.log('Total calculado automáticamente:', calculatedTotal);
      }
      
      console.log('Creando pedido con datos:', orderData);
      
      const response: IApiResponse<IOrder> = await apiRequest('/orders', 'POST', orderData);
      console.log('Respuesta de creación:', response);
      
      return response;
    } catch (error) {
      console.error('Error creando pedido:', error);
      throw error;
    }
  }

  async function updateOrder(orderId: string, orderData: IOrderUpdate): Promise<IApiResponse<IOrder>> {
    try {
      const response: IApiResponse<IOrder> = await apiRequest(`/orders/${orderId}`, 'PUT', orderData);
      return response;
    } catch (error) {
      console.error('Error actualizando pedido:', error);
      throw error;
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<IApiResponse<IOrder>> {
    try {
      const currentOrder: IApiResponse<IOrder> = await apiRequest(`/orders/${orderId}`);
      if (!currentOrder.success) throw new Error(currentOrder.message);
      
      const orderData: IOrder = currentOrder.data!;
      
      const items = orderData.items.map(item => ({
        product: typeof item.product === 'object' ? (item.product as any)._id : item.product,
        quantity: item.quantity,
        price: item.price || 0,
        specialInstructions: item.specialInstructions || ''
      }));
      
      const total: number = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const updatedData: IOrderUpdate = {
        items: items,
        tableNumber: orderData.tableNumber,
        notes: orderData.notes || '',
        paymentMethod: orderData.paymentMethod,
        total: total,
        status: newStatus
      };
      
      const response: IApiResponse<IOrder> = await apiRequest(`/orders/${orderId}`, 'PUT', updatedData);
      return response;
    } catch (error) {
      console.error('Error actualizando estado del pedido:', error);
      throw error;
    }
  }

  async function deleteOrder(orderId: string): Promise<IApiResponse<void>> {
    try {
      const response: IApiResponse<void> = await apiRequest(`/orders/${orderId}`, 'DELETE');
      return response;
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      throw error;
    }
  }

  // ============================================================================
  // FUNCIONES DE PRODUCTOS
  // ============================================================================

  async function getProducts(filters: IProductFilters = {}): Promise<IApiResponse<IProduct[]>> {
    try {
      const params: URLSearchParams = new URLSearchParams();
      
      Object.keys(filters).forEach((key: string) => {
        const value: any = (filters as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      if (!params.has('limit')) {
        params.append('limit', '100');
      }

      const response: IApiResponse<IProduct[]> = await apiRequest(`/products?${params}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  }

  async function getProductById(productId: string): Promise<IApiResponse<IProduct>> {
    try {
      const response: IApiResponse<IProduct> = await apiRequest(`/products/${productId}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      throw error;
    }
  }

  // ============================================================================
  // FUNCIONES DE CATEGORÍAS
  // ============================================================================

  async function getCategories(): Promise<IApiResponse<ICategory[]>> {
    try {
      const response: IApiResponse<ICategory[]> = await apiRequest('/categories');
      return response;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  function formatOrderStatus(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pendiente',
      [OrderStatus.CONFIRMED]: 'Confirmado',
      [OrderStatus.PREPARING]: 'Preparando',
      [OrderStatus.READY]: 'Listo',
      [OrderStatus.DELIVERED]: 'Entregado',
      [OrderStatus.CANCELLED]: 'Cancelado'
    };
    return statusMap[status] || status;
  }

  function formatPaymentMethod(method: PaymentMethod | string): string {
    const methodMap: Record<string, string> = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia'
    };
    return methodMap[method] || method || 'No especificado';
  }

  function canUpdateOrder(order: IOrder, userRole: UserRole): boolean {
    if (userRole === UserRole.ADMIN) return true;
    
    if (userRole === UserRole.WAITER) {
      return [OrderStatus.PENDING].includes(order.status);
    }
    
    if (userRole === UserRole.CHEF) {
      return [OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(order.status);
    }
    
    return false;
  }

  function getAllowedStatusTransitions(currentStatus: OrderStatus, userRole: UserRole): OrderStatus[] {
    const transitions: Record<UserRole, Partial<Record<OrderStatus, OrderStatus[]>>> = {
      [UserRole.ADMIN]: {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
        [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
        [OrderStatus.READY]: [OrderStatus.DELIVERED],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: []
      },
      [UserRole.WAITER]: {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED],
        [OrderStatus.READY]: [OrderStatus.DELIVERED]
      },
      [UserRole.CHEF]: {
        [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING],
        [OrderStatus.PREPARING]: [OrderStatus.READY]
      },
      [UserRole.CUSTOMER]: {}
    };
    
    return transitions[userRole]?.[currentStatus] || [];
  }

  // ============================================================================
  // INICIALIZACIÓN Y EVENT LISTENERS
  // ============================================================================

  async function initializeApp(): Promise<void> {
    console.log('🚀 Inicializando app TypeScript...');
    
    const storedUser: string | null = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser) as IUser;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        clearAuthData();
      }
    }

    if (authToken) {
      const isValid: boolean = await verifyToken();
      if (!isValid) {
        clearAuthData();
        const publicPages: string[] = ['/login', '/register', '/'];
        if (!publicPages.includes(window.location.pathname)) {
          window.location.href = '/login';
        }
      } else {
        displayUserInfo();
      }
    } else {
      const publicPages: string[] = ['/login', '/register', '/'];
      if (!publicPages.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    
    console.log('✅ App inicializada correctamente');
  }

  function setupEventListeners(): void {
    const loginForm: HTMLFormElement | null = document.getElementById('loginForm') as HTMLFormElement;
    if (loginForm) {
      loginForm.addEventListener('submit', async (e: Event): Promise<void> => {
        e.preventDefault();
        const formData: FormData = new FormData(e.target as HTMLFormElement);
        const credentials = {
          email: formData.get('email') as string,
          password: formData.get('password') as string
        };
        await login(credentials);
      });
    }

    const registerForm: HTMLFormElement | null = document.getElementById('registerForm') as HTMLFormElement;
    if (registerForm) {
      registerForm.addEventListener('submit', async (e: Event): Promise<void> => {
        e.preventDefault();
        const formData: FormData = new FormData(e.target as HTMLFormElement);
        const userData = {
          name: formData.get('name') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string,
          role: formData.get('role') as string
        };
        await register(userData);
      });
    }

    const logoutBtn: HTMLElement | null = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }

    const loginLink: HTMLElement | null = document.getElementById('loginLink');
    const registerLink: HTMLElement | null = document.getElementById('registerLink');
    
    if (loginLink) {
      loginLink.addEventListener('click', (e: Event): void => {
        e.preventDefault();
        window.location.href = '/login';
      });
    }
    
    if (registerLink) {
      registerLink.addEventListener('click', (e: Event): void => {
        e.preventDefault();
        window.location.href = '/register';
      });
    }
  }

  // UN SOLO DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', (): void => {
      initializeApp();
      setupEventListeners();
    });
  } else {
    // DOM ya cargado
    initializeApp();
    setupEventListeners();
  }

  // ============================================================================
  // EXPORTAR UTILIDADES GLOBALES
  // ============================================================================

  (window as any).appUtils = {
    apiRequest,
    getCurrentUser: (): IUser | null => currentUser,
    getAuthToken: (): string | null => authToken,  // ✅ Retorna string | null correctamente
    logout,
    showAlert,
    createFloatingAlert,
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    getProducts,
    getProductById,
    getCategories,
    formatOrderStatus,
    formatPaymentMethod,
    canUpdateOrder,
    getAllowedStatusTransitions
  };

  console.log('✅ appUtils exportado globalmente');

})();