const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para verificar token JWT
 * Extrae el token del header Authorization y verifica su validez
 */
const authenticateToken = async (req, res, next) => {
  try {
    // 1. Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido. Por favor incluya el header Authorization.'
      });
    }

    // Verificar formato: "Bearer TOKEN"
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    // Extraer el token
    const token = authHeader.substring(7); // Remover "Bearer "

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // 2. Verificar y decodificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      let message = 'Token inválido';
      
      if (jwtError.name === 'TokenExpiredError') {
        message = 'Token expirado. Por favor inicie sesión nuevamente.';
      } else if (jwtError.name === 'JsonWebTokenError') {
        message = 'Token malformado o inválido';
      } else if (jwtError.name === 'NotBeforeError') {
        message = 'Token aún no es válido';
      }
      
      return res.status(401).json({
        success: false,
        message
      });
    }

    // 3. Verificar que el usuario aún existe y está activo
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado. Token inválido.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada. Contacte al administrador.'
      });
    }

    // 4. Verificar que el token no haya sido emitido antes de un cambio de contraseña
    // (En un sistema real, tendrías un campo passwordChangedAt en el modelo User)
    if (decoded.iat && user.passwordChangedAt) {
      const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      
      if (decoded.iat < passwordChangedTimestamp) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña cambiada recientemente. Por favor inicie sesión nuevamente.'
        });
      }
    }

    // 5. Agregar información del usuario al request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Error en authenticateToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al verificar autenticación'
    });
  }
};

/**
 * Middleware opcional de autenticación
 * Si hay token lo verifica, si no hay token continúa sin usuario
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  // Si hay token, usar el middleware normal
  authenticateToken(req, res, next);
};

/**
 * Middleware para verificar que el usuario sea el propietario del recurso o admin
 */
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    // Si es admin, puede acceder a todo
    if (req.user.role === 'admin') {
      return next();
    }

    // Verificar ownership
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido en el recurso'
      });
    }

    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para acceder a este recurso'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario autenticado sea el mismo del parámetro
 */
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  // Si es admin, puede acceder a cualquier usuario
  if (req.user.role === 'admin') {
    return next();
  }

  // Si intenta acceder a su propio perfil
  const targetUserId = req.params.id || req.params.userId;
  
  if (req.user._id.toString() === targetUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Solo puede acceder a su propio perfil'
  });
};

/**
 * Middleware para verificar múltiples tokens o API keys (futuro)
 */
const flexibleAuth = async (req, res, next) => {
  // Intentar autenticación JWT primero
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, next);
  }
  
  // Aquí podrías agregar otros métodos de autenticación
  // Como API keys, OAuth, etc.
  
  return res.status(401).json({
    success: false,
    message: 'Método de autenticación requerido'
  });
};

/**
 * Middleware para logging de accesos autenticados
 */
const logAuthAccess = (req, res, next) => {
  if (req.user) {
    console.log(`🔐 Usuario autenticado: ${req.user.email} (${req.user.role}) - ${req.method} ${req.originalUrl}`);
  }
  next();
};

/**
 * Middleware para refresh de tokens cercanos a expirar
 */
const checkTokenExpiration = (req, res, next) => {
  if (req.user && req.token) {
    try {
      const decoded = jwt.decode(req.token);
      const now = Math.floor(Date.now() / 1000);
      const timeToExpire = decoded.exp - now;
      
      // Si el token expira en menos de 30 minutos, agregar header sugerencia
      if (timeToExpire < 30 * 60) {
        res.set('X-Token-Refresh-Suggested', 'true');
        res.set('X-Token-Expires-In', timeToExpire.toString());
      }
    } catch (error) {
      // No hacer nada si no se puede decodificar
    }
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireOwnershipOrAdmin,
  requireSelfOrAdmin,
  flexibleAuth,
  logAuthAccess,
  checkTokenExpiration,
  // Aliases para compatibilidad
  auth: authenticateToken,
  protect: authenticateToken
};