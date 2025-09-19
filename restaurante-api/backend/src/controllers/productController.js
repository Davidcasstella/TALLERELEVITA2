const Product = require('../models/Product');
const Category = require('../models/Category');
const cloudinary = require('cloudinary').v2;

/**
 * Obtener lista de productos
 */
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener detalle de un producto por ID
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id)
      .populate('category', 'name')
      .exec();
    
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error obteniendo el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Crear un nuevo producto
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, price, category, description, ingredients, preparationTime } = req.body;
    
    // Validar datos
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios'
      });
    }
    
    // Verificar categoría
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Categoría no válida'
      });
    }
    
    // Subir imagen a Cloudinary si existe
    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'restaurante/productos',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        transformation: [
          { width: 800, height: 800, crop: 'limit' }
        ]
      });
      imageUrl = result.secure_url;
    }
    
    // Crear producto
    const newProduct = new Product({
      name,
      price,
      category,
      description,
      ingredients,
      preparationTime,
      image: imageUrl
    });
    
    await newProduct.save();
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: newProduct
    });
  } catch (error) {
    console.error('Error creando el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar un producto existente
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, ingredients, preparationTime } = req.body;
    
    // Validar datos
    if (!name && !price && !category && !description && !ingredients && !preparationTime && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar'
      });
    }
    
    // Verificar categoría si se proporciona
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Categoría no válida'
        });
      }
    }
    
    // Buscar el producto actual
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Actualizar imagen en Cloudinary si se proporciona
    let imageUrl = currentProduct.image; // Mantener la imagen actual por defecto
    if (req.file) {
      try {
        // Eliminar imagen anterior de Cloudinary si existe
        if (currentProduct.image) {
          // Extraer el public_id de la URL de Cloudinary
          const urlParts = currentProduct.image.split('/');
          const filename = urlParts[urlParts.length - 1];
          const publicId = `restaurante/productos/${filename.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
        }
        
        // Subir nueva imagen
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'restaurante/productos',
          allowed_formats: ['jpg', 'png', 'jpeg'],
          transformation: [
            { width: 800, height: 800, crop: 'limit' }
          ]
        });
        imageUrl = result.secure_url;
      } catch (cloudinaryError) {
        console.error('Error con Cloudinary:', cloudinaryError);
        // Continuar sin actualizar la imagen si hay error
      }
    }
    
    // Preparar datos para actualizar
    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (ingredients) updateData.ingredients = ingredients;
    if (preparationTime) updateData.preparationTime = preparationTime;
    if (imageUrl) updateData.image = imageUrl;
    
    // Actualizar producto
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { 
      new: true 
    }).populate('category', 'name');
    
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error actualizando el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar un producto
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar el producto antes de eliminarlo
    const productToDelete = await Product.findById(id);
    
    if (!productToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Eliminar imagen de Cloudinary si existe
    if (productToDelete.image) {
      try {
        // Extraer el public_id de la URL de Cloudinary
        const urlParts = productToDelete.image.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `restaurante/productos/${filename.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error('Error eliminando imagen de Cloudinary:', cloudinaryError);
        // Continuar con la eliminación del producto aunque falle la eliminación de la imagen
      }
    }
    
    // Eliminar producto de la base de datos
    await Product.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando el producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};