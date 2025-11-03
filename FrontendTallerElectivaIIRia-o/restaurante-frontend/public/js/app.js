
const API_URL = 'https://tallerelevita2-1.onrender.com/api'; 


let currentUser = null;
let authToken = localStorage.getItem('authToken');

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});


async function initializeApp() {
   
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }

    
    if (authToken) {
        const isValid = await verifyToken();
        if (!isValid) {
            
            clearAuthData();
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        } else {
            
            displayUserInfo();
        }
    } else {
        
        const publicPages = ['/login', '/register', '/'];
        if (!publicPages.includes(window.location.pathname)) {
            window.location.href = '/login';
        }
    }
}

// Función para mostrar alertas mejorada
function showAlert(elementId, message, type = 'error') {
    // Si elementId es un string y existe el elemento, usarlo
    let targetElement = null;
    if (typeof elementId === 'string') {
        targetElement = document.getElementById(elementId);
    }
    
    // Si no existe el elemento o elementId no es válido, crear alerta flotante
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
        ${type === 'error' ? 'background-color: #dc3545;' : 
          type === 'success' ? 'background-color: #28a745;' : 
          'background-color: #17a2b8;'}
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

async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    
    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Agregar datos si es POST/PUT/PATCH
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
    } catch (error) {
        console.error('Error en API:', error);
        throw error;
    }
}

// Verificar token
async function verifyToken() {
    try {
        // Intentar hacer una petición autenticada simple
        await apiRequest('/orders?limit=1');
        return true;
    } catch (error) {
        console.log('Token inválido:', error.message);
        return false;
    }
}

// Limpiar datos de autenticación
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
}

// Mostrar información del usuario en páginas protegidas
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

// Función de login
async function login(credentials) {
    try {
        showLoading('loginForm', true);
        const response = await apiRequest('/auth/login', 'POST', credentials);
        
        if (response.success) {
            authToken = response.token;
            currentUser = response.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showAlert('loginAlert', 'Login exitoso', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        }
    } catch (error) {
        showAlert('loginAlert', error.message || 'Error al iniciar sesión', 'error');
    } finally {
        showLoading('loginForm', false);
    }
}

// Función de registro
async function register(userData) {
    try {
        showLoading('registerForm', true);
        const response = await apiRequest('/auth/register', 'POST', userData);
        
        if (response.success) {
            authToken = response.token;
            currentUser = response.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showAlert('registerAlert', 'Registro exitoso', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        }
    } catch (error) {
        showAlert('registerAlert', error.message || 'Error al registrarse', 'error');
    } finally {
        showLoading('registerForm', false);
    }
}

// Función de logout
async function logout() {
    try {
        // Intentar hacer logout en el servidor (opcional)
        await apiRequest('/auth/logout', 'POST');
    } catch (error) {
        console.log('Error en logout del servidor:', error);
    } finally {
        clearAuthData();
        window.location.href = '/login';
    }
}

// Mostrar/ocultar estado de carga
function showLoading(formId, show) {
    const form = document.getElementById(formId);
    if (form) {
        if (show) {
            form.classList.add('loading');
        } else {
            form.classList.remove('loading');
        }
    }
}

// ============================================================================
// FUNCIONES ESPECÍFICAS PARA PEDIDOS
// ============================================================================

// Obtener todos los pedidos con filtros
async function getOrders(filters = {}) {
    try {
        const params = new URLSearchParams();
        
        // Agregar filtros si existen
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });

        const response = await apiRequest(`/orders?${params}`);
        return response;
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        throw error;
    }
}

// Obtener un pedido específico por ID
async function getOrderById(orderId) {
    try {
        const response = await apiRequest(`/orders/${orderId}`);
        return response;
    } catch (error) {
        console.error('Error obteniendo pedido:', error);
        throw error;
    }
}

// Crear nuevo pedido
async function createOrder(orderData) {
    try {
        // ✅ ASEGURAR QUE EL TOTAL ESTÉ CORRECTAMENTE CALCULADO
        if (!orderData.total || orderData.total === 0) {
            const calculatedTotal = orderData.items.reduce((sum, item) => {
                const itemPrice = parseFloat(item.price) || 0;
                const itemQuantity = parseInt(item.quantity) || 1;
                return sum + (itemPrice * itemQuantity);
            }, 0);
            
            orderData.total = calculatedTotal;
            console.log('Total calculado automáticamente:', calculatedTotal);
        }
        
        console.log('Creando pedido con datos:', orderData);
        
        const response = await apiRequest('/orders', 'POST', orderData);
        console.log('Respuesta de creación:', response);
        
        return response;
    } catch (error) {
        console.error('Error creando pedido:', error);
        throw error;
    }
}
// FUNCIÓN ADICIONAL PARA DEBUGGING - Agregar esta función nueva:
async function debugOrderTotal(orderId) {
    try {
        const response = await apiRequest(`/orders/${orderId}`);
        if (response.success) {
            const order = response.data;
            console.log('=== DEBUG PEDIDO ===');
            console.log('ID:', order._id);
            console.log('Total guardado:', order.total);
            console.log('Items:');
            order.items.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.product?.name || 'Producto'}`);
                console.log(`     Cantidad: ${item.quantity}`);
                console.log(`     Precio: $${item.price}`);
                console.log(`     Subtotal: $${item.price * item.quantity}`);
            });
            
            const calculatedTotal = order.items.reduce((sum, item) => 
                sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
            console.log('Total calculado:', calculatedTotal);
            console.log('¿Coinciden?', order.total === calculatedTotal);
            console.log('==================');
        }
    } catch (error) {
        console.error('Error en debug:', error);
    }
}
// Actualizar pedido completo
async function updateOrder(orderId, orderData) {
    try {
        const response = await apiRequest(`/orders/${orderId}`, 'PUT', orderData);
        return response;
    } catch (error) {
        console.error('Error actualizando pedido:', error);
        throw error;
    }
}

// Actualizar solo el estado de un pedido - VERSION CORREGIDA
async function updateOrderStatus(orderId, newStatus) {
    try {
        // Primero obtener el pedido actual
        const currentOrder = await apiRequest(`/orders/${orderId}`);
        if (!currentOrder.success) throw new Error(currentOrder.message);
        
        const orderData = currentOrder.data;
        console.log('Pedido actual obtenido:', orderData);
        
        // CORREGIDO: Incluir precios y calcular total
        const items = orderData.items.map(item => ({
            product: item.product._id || item.product,
            quantity: item.quantity,
            price: item.price || 0, // ✅ MANTENER EL PRECIO ORIGINAL
            specialInstructions: item.specialInstructions || ''
        }));
        
        // ✅ CALCULAR EL TOTAL CORRECTAMENTE
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        console.log('Items procesados:', items);
        console.log('Total calculado:', total);
        
        const updatedData = {
            items: items,
            tableNumber: orderData.tableNumber,
            notes: orderData.notes || '',
            paymentMethod: orderData.paymentMethod,
            total: total, // ✅ INCLUIR EL TOTAL CALCULADO
            status: newStatus // Nuevo estado
        };
        
        console.log('Datos a enviar para actualización:', updatedData);
        
        const response = await apiRequest(`/orders/${orderId}`, 'PUT', updatedData);
        console.log('Respuesta de actualización:', response);
        
        return response;
    } catch (error) {
        console.error('Error actualizando estado del pedido:', error);
        throw error;
    }
}

// Eliminar pedido
async function deleteOrder(orderId) {
    try {
        const response = await apiRequest(`/orders/${orderId}`, 'DELETE');
        return response;
    } catch (error) {
        console.error('Error eliminando pedido:', error);
        throw error;
    }
}

// ============================================================================
// FUNCIONES ESPECÍFICAS PARA PRODUCTOS
// ============================================================================

// Reemplaza la función getProducts en tu app.js con esta versión corregida:

// Obtener todos los productos
async function getProducts(filters = {}) {
    try {
        const params = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });

        // Agregar parámetros por defecto para obtener todos los productos disponibles
        if (!params.has('limit')) {
            params.append('limit', '100'); // Obtener hasta 100 productos
        }

        const response = await apiRequest(`/products?${params}`);
        
        console.log('Response from /products API:', response);
        
        return response;
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        throw error;
    }
}

// Obtener producto por ID
async function getProductById(productId) {
    try {
        const response = await apiRequest(`/products/${productId}`);
        return response;
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        throw error;
    }
}

// ============================================================================
// FUNCIONES ESPECÍFICAS PARA CATEGORÍAS
// ============================================================================

// Obtener todas las categorías
async function getCategories() {
    try {
        const response = await apiRequest('/categories');
        return response;
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        throw error;
    }
}

// ============================================================================
// UTILIDADES PARA PEDIDOS
// ============================================================================

// Formatear estado de pedido para mostrar
function formatOrderStatus(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmado', 
        'preparing': 'Preparando',
        'ready': 'Listo',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
}

// Formatear método de pago
function formatPaymentMethod(method) {
    const methodMap = {
        'cash': 'Efectivo',
        'card': 'Tarjeta',
        'transfer': 'Transferencia'
    };
    return methodMap[method] || method || 'No especificado';
}

// Verificar si el usuario puede actualizar un pedido
function canUpdateOrder(order, userRole) {
    if (userRole === 'admin') return true;
    
    // Los empleados pueden actualizar pedidos según su rol y el estado
    if (userRole === 'waiter') {
        return ['pending'].includes(order.status);
    }
    
    if (userRole === 'chef') {
        return ['confirmed', 'preparing'].includes(order.status);
    }
    
    // Los clientes solo pueden ver sus pedidos, no actualizarlos
    return false;
}

// Obtener los estados permitidos para transición
function getAllowedStatusTransitions(currentStatus, userRole) {
    const transitions = {
        'admin': {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['delivered'],
            'delivered': [],
            'cancelled': []
        },
        'waiter': {
            'pending': ['confirmed'],
            'ready': ['delivered']
        },
        'chef': {
            'confirmed': ['preparing'],
            'preparing': ['ready']
        }
    };
    
    return transitions[userRole]?.[currentStatus] || [];
}

// Event listeners globales
document.addEventListener('DOMContentLoaded', function() {
    // Formulario de login
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

    // Formulario de registro
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

    // Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Enlaces de navegación entre login y registro
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
});

// Funciones utilitarias globales
window.appUtils = {
    // API
    apiRequest,
    
    // Auth
    getCurrentUser: () => currentUser,
    getAuthToken: () => authToken,
    logout,
    
    // UI
    showAlert,
    createFloatingAlert,
    
    // Orders
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    
    // Products
    getProducts,
    getProductById,
    
    // Categories
    getCategories,
    
    // Utilities
    formatOrderStatus,
    formatPaymentMethod,
    canUpdateOrder,
    getAllowedStatusTransitions
};