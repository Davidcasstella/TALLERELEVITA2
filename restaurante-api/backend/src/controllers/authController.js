const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *           example: "juan@email.com"
 *         password:
 *           type: string
 *           description: Contraseña del usuario
 *           example: "123456"
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre completo del usuario
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           format: email
 *           description: Email único del usuario
 *           example: "juan@email.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Contraseña (mínimo 6 caracteres)
 *           example: "123456"
 *         role:
 *           type: string
 *           enum: [customer, waiter, chef, admin]
 *           description: Rol del usuario
 *           example: "customer"
 */

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
 * Login de usuario
 * @param {Request} req
 * @param {Response} res
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validar datos de entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // 2. Verificar si el usuario existe
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // 3. Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // 4. Generar token JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '24h' // Expira en 24 horas
    });

    // 5. Devolver respuesta
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Registro de nuevo usuario
 * @param {Request} req
 * @param {Response} res
 */
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // 1. Validar datos de entrada
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // 2. Verificar si el email ya está en uso
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // 3. Crear nuevo usuario
    const newUser = new User({
      name,
      email,
      password,
      role
    });

    await newUser.save();

    // 4. Generar token JWT
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
      expiresIn: '24h' // Expira en 24 horas
    });

    // 5. Devolver respuesta
    res.status(201).json({
      success: true,
      message: 'Registro exitoso',
      token,
      user: newUser.getPublicProfile()
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Logout de usuario
 * @param {Request} req
 * @param {Response} res
 */
exports.logout = async (req, res) => {
  // En el logout simplemente se puede eliminar el token del cliente
  // No es necesario hacer nada en el servidor (a menos que se quiera implementar una lista de revocación de tokens)
  
  res.json({ success: true, message: 'Logout exitoso' });
};

/**
 * Refresh de token
 * @param {Request} req
 * @param {Response} res
 */
exports.refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de refresh requerido'
    });
  }

  try {
    // Verificar si el token es válido y no ha expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Generar un nuevo token
    const newToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      success: true,
      message: 'Token refrescado exitosamente',
      token: newToken
    });
  } catch (error) {
    console.error('Error en refreshToken:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};