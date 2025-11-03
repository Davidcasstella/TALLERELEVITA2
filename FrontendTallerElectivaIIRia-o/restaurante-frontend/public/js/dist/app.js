/**
 * APLICACIÓN FRONTEND EN TYPESCRIPT - VERSIÓN FINAL
 * Sin imports - Wrapped en IIFE - Sin duplicados
 */
(function () {
    'use strict';
    // ============================================================================
    // TYPES & INTERFACES
    // ============================================================================
    let UserRole;
    (function (UserRole) {
        UserRole["ADMIN"] = "admin";
        UserRole["CHEF"] = "chef";
        UserRole["WAITER"] = "waiter";
        UserRole["CUSTOMER"] = "customer";
    })(UserRole || (UserRole = {}));
    let OrderStatus;
    (function (OrderStatus) {
        OrderStatus["PENDING"] = "pending";
        OrderStatus["CONFIRMED"] = "confirmed";
        OrderStatus["PREPARING"] = "preparing";
        OrderStatus["READY"] = "ready";
        OrderStatus["DELIVERED"] = "delivered";
        OrderStatus["CANCELLED"] = "cancelled";
    })(OrderStatus || (OrderStatus = {}));
    let PaymentMethod;
    (function (PaymentMethod) {
        PaymentMethod["CASH"] = "cash";
        PaymentMethod["CARD"] = "card";
        PaymentMethod["TRANSFER"] = "transfer";
    })(PaymentMethod || (PaymentMethod = {}));
    // ============================================================================
    // CONFIGURACIÓN Y ESTADO GLOBAL
    // ============================================================================
    const API_URL = 'https://tallerelevita2-1.onrender.com/api';
    let currentUser = null;
    let authToken = localStorage.getItem('authToken');
    function showAlert(elementId, message, type = 'error') {
        let targetElement = null;
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
            targetElement.classList.add('hidden');
        }, 5000);
    }
    function createFloatingAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `floating-alert alert-${type}`;
        alert.textContent = message;
        const backgroundColor = type === 'error' ? '#dc3545' :
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
    function showLoading(formId, show) {
        const form = document.getElementById(formId);
        if (form) {
            if (show) {
                form.classList.add('loading');
            }
            else {
                form.classList.remove('loading');
            }
        }
    }
    async function apiRequest(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        // ✅ Verificar que authToken no sea null antes de usarlo
        if (authToken !== null && authToken !== undefined) {
            options.headers['Authorization'] = `Bearer ${authToken}`;
        }
        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            options.body = JSON.stringify(data);
        }
        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Error en la petición');
            }
            return result;
        }
        catch (error) {
            console.error('Error en API:', error);
            throw error;
        }
    }
    // ============================================================================
    // AUTENTICACIÓN
    // ============================================================================
    async function verifyToken() {
        try {
            await apiRequest('/orders?limit=1');
            return true;
        }
        catch (error) {
            console.log('Token inválido:', error.message);
            return false;
        }
    }
    function clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        authToken = null;
        currentUser = null;
    }
    function displayUserInfo() {
        const userInfoElement = document.getElementById('userInfo');
        const userDetailsElement = document.getElementById('userDetails');
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
    async function login(credentials) {
        console.log('🔐 Intentando login con:', credentials.email);
        try {
            showLoading('loginForm', true);
            const response = await apiRequest('/auth/login', 'POST', credentials);
            console.log('✅ Respuesta del servidor:', response);
            // ✅ El backend envía token y user directamente en response (no en response.data)
            const token = response.data?.token || response.token;
            const user = response.data?.user || response.user;
            if (token && user) {
                authToken = token; // ✅ Ya verificado que no es undefined
                currentUser = user;
                localStorage.setItem('authToken', token); // ✅ Usar la constante local verificada
                localStorage.setItem('currentUser', JSON.stringify(user));
                console.log('✅ Token guardado:', token.substring(0, 20) + '...');
                console.log('✅ Usuario guardado:', user);
                showAlert('loginAlert', '¡Login exitoso! Redirigiendo...', 'success');
                setTimeout(() => {
                    console.log('🔄 Redirigiendo a /dashboard');
                    window.location.href = '/dashboard';
                }, 500);
            }
            else {
                console.error('❌ No se encontró token o usuario en la respuesta');
                console.error('Respuesta completa:', JSON.stringify(response, null, 2));
                throw new Error('No se recibió token del servidor');
            }
        }
        catch (error) {
            console.error('❌ Error en login:', error);
            showAlert('loginAlert', error.message || 'Error al iniciar sesión', 'error');
        }
        finally {
            showLoading('loginForm', false);
        }
    }
    async function register(userData) {
        console.log('📝 Intentando registro:', userData.email);
        try {
            showLoading('registerForm', true);
            const response = await apiRequest('/auth/register', 'POST', userData);
            console.log('✅ Respuesta del registro:', response);
            // ✅ El backend envía token y user directamente en response (no en response.data)
            const token = response.data?.token || response.token;
            const user = response.data?.user || response.user;
            if (token && user) {
                authToken = token; // ✅ Ya verificado que no es undefined
                currentUser = user;
                localStorage.setItem('authToken', token); // ✅ Usar la constante local verificada
                localStorage.setItem('currentUser', JSON.stringify(user));
                console.log('✅ Registro exitoso, redirigiendo...');
                showAlert('registerAlert', '¡Registro exitoso! Redirigiendo...', 'success');
                setTimeout(() => {
                    console.log('🔄 Redirigiendo a /dashboard');
                    window.location.href = '/dashboard';
                }, 500);
            }
            else {
                throw new Error('No se recibió token del servidor');
            }
        }
        catch (error) {
            console.error('❌ Error en registro:', error);
            showAlert('registerAlert', error.message || 'Error al registrarse', 'error');
        }
        finally {
            showLoading('registerForm', false);
        }
    }
    async function logout() {
        try {
            await apiRequest('/auth/logout', 'POST');
        }
        catch (error) {
            console.log('Error en logout del servidor:', error);
        }
        finally {
            clearAuthData();
            window.location.href = '/login';
        }
    }
    // ============================================================================
    // FUNCIONES DE PEDIDOS
    // ============================================================================
    async function getOrders(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach((key) => {
                const value = filters[key];
                if (value !== null && value !== undefined && value !== '') {
                    params.append(key, String(value));
                }
            });
            const response = await apiRequest(`/orders?${params}`);
            return response;
        }
        catch (error) {
            console.error('Error obteniendo pedidos:', error);
            throw error;
        }
    }
    async function getOrderById(orderId) {
        try {
            const response = await apiRequest(`/orders/${orderId}`);
            return response;
        }
        catch (error) {
            console.error('Error obteniendo pedido:', error);
            throw error;
        }
    }
    async function createOrder(orderData) {
        try {
            if (!orderData.total || orderData.total === 0) {
                const calculatedTotal = orderData.items.reduce((sum, item) => {
                    const itemPrice = parseFloat(String(item.price)) || 0;
                    const itemQuantity = parseInt(String(item.quantity)) || 1;
                    return sum + (itemPrice * itemQuantity);
                }, 0);
                orderData.total = calculatedTotal;
                console.log('Total calculado automáticamente:', calculatedTotal);
            }
            console.log('Creando pedido con datos:', orderData);
            const response = await apiRequest('/orders', 'POST', orderData);
            console.log('Respuesta de creación:', response);
            return response;
        }
        catch (error) {
            console.error('Error creando pedido:', error);
            throw error;
        }
    }
    async function updateOrder(orderId, orderData) {
        try {
            const response = await apiRequest(`/orders/${orderId}`, 'PUT', orderData);
            return response;
        }
        catch (error) {
            console.error('Error actualizando pedido:', error);
            throw error;
        }
    }
    async function updateOrderStatus(orderId, newStatus) {
        try {
            const currentOrder = await apiRequest(`/orders/${orderId}`);
            if (!currentOrder.success)
                throw new Error(currentOrder.message);
            const orderData = currentOrder.data;
            const items = orderData.items.map(item => ({
                product: typeof item.product === 'object' ? item.product._id : item.product,
                quantity: item.quantity,
                price: item.price || 0,
                specialInstructions: item.specialInstructions || ''
            }));
            const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const updatedData = {
                items: items,
                tableNumber: orderData.tableNumber,
                notes: orderData.notes || '',
                paymentMethod: orderData.paymentMethod,
                total: total,
                status: newStatus
            };
            const response = await apiRequest(`/orders/${orderId}`, 'PUT', updatedData);
            return response;
        }
        catch (error) {
            console.error('Error actualizando estado del pedido:', error);
            throw error;
        }
    }
    async function deleteOrder(orderId) {
        try {
            const response = await apiRequest(`/orders/${orderId}`, 'DELETE');
            return response;
        }
        catch (error) {
            console.error('Error eliminando pedido:', error);
            throw error;
        }
    }
    // ============================================================================
    // FUNCIONES DE PRODUCTOS
    // ============================================================================
    async function getProducts(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach((key) => {
                const value = filters[key];
                if (value !== null && value !== undefined && value !== '') {
                    params.append(key, String(value));
                }
            });
            if (!params.has('limit')) {
                params.append('limit', '100');
            }
            const response = await apiRequest(`/products?${params}`);
            return response;
        }
        catch (error) {
            console.error('Error obteniendo productos:', error);
            throw error;
        }
    }
    async function getProductById(productId) {
        try {
            const response = await apiRequest(`/products/${productId}`);
            return response;
        }
        catch (error) {
            console.error('Error obteniendo producto:', error);
            throw error;
        }
    }
    // ============================================================================
    // FUNCIONES DE CATEGORÍAS
    // ============================================================================
    async function getCategories() {
        try {
            const response = await apiRequest('/categories');
            return response;
        }
        catch (error) {
            console.error('Error obteniendo categorías:', error);
            throw error;
        }
    }
    // ============================================================================
    // UTILIDADES
    // ============================================================================
    function formatOrderStatus(status) {
        const statusMap = {
            [OrderStatus.PENDING]: 'Pendiente',
            [OrderStatus.CONFIRMED]: 'Confirmado',
            [OrderStatus.PREPARING]: 'Preparando',
            [OrderStatus.READY]: 'Listo',
            [OrderStatus.DELIVERED]: 'Entregado',
            [OrderStatus.CANCELLED]: 'Cancelado'
        };
        return statusMap[status] || status;
    }
    function formatPaymentMethod(method) {
        const methodMap = {
            'cash': 'Efectivo',
            'card': 'Tarjeta',
            'transfer': 'Transferencia'
        };
        return methodMap[method] || method || 'No especificado';
    }
    function canUpdateOrder(order, userRole) {
        if (userRole === UserRole.ADMIN)
            return true;
        if (userRole === UserRole.WAITER) {
            return [OrderStatus.PENDING].includes(order.status);
        }
        if (userRole === UserRole.CHEF) {
            return [OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(order.status);
        }
        return false;
    }
    function getAllowedStatusTransitions(currentStatus, userRole) {
        const transitions = {
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
    async function initializeApp() {
        console.log('🚀 Inicializando app TypeScript...');
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
            }
            catch (error) {
                console.error('Error parsing stored user:', error);
                clearAuthData();
            }
        }
        if (authToken) {
            const isValid = await verifyToken();
            if (!isValid) {
                clearAuthData();
                const publicPages = ['/login', '/register', '/'];
                if (!publicPages.includes(window.location.pathname)) {
                    window.location.href = '/login';
                }
            }
            else {
                displayUserInfo();
            }
        }
        else {
            const publicPages = ['/login', '/register', '/'];
            if (!publicPages.includes(window.location.pathname)) {
                window.location.href = '/login';
            }
        }
        console.log('✅ App inicializada correctamente');
    }
    function setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const credentials = {
                    email: formData.get('email'),
                    password: formData.get('password')
                };
                await login(credentials);
            });
        }
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const userData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    role: formData.get('role')
                };
                await register(userData);
            });
        }
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
        const loginLink = document.getElementById('loginLink');
        const registerLink = document.getElementById('registerLink');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/login';
            });
        }
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = '/register';
            });
        }
    }
    // UN SOLO DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeApp();
            setupEventListeners();
        });
    }
    else {
        // DOM ya cargado
        initializeApp();
        setupEventListeners();
    }
    // ============================================================================
    // EXPORTAR UTILIDADES GLOBALES
    // ============================================================================
    window.appUtils = {
        apiRequest,
        getCurrentUser: () => currentUser,
        getAuthToken: () => authToken, // ✅ Retorna string | null correctamente
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
//# sourceMappingURL=app.js.map