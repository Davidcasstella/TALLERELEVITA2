const Category = require('../models/Category');

/**
 * Obtener todas las categorías
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .sort({ sortOrder: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener categoría por ID
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Crear nueva categoría
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, sortOrder } = req.body;
    
    // Verificar si ya existe una categoría con ese nombre
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }
    
    const newCategory = new Category({
      name,
      description,
      icon,
      sortOrder: sortOrder || 0
    });
    
    await newCategory.save();
    
    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: newCategory
    });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar categoría
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, sortOrder } = req.body;
    
    // Verificar si existe otra categoría con el mismo nombre
    if (name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra categoría con ese nombre'
        });
      }
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id, 
      { name, description, icon, sortOrder },
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar categoría
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si hay productos asociados a esta categoría
    const Product = require('../models/Product');
    const productsCount = await Product.countDocuments({ category: id });
    
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${productsCount} producto(s) asociado(s)`
      });
    }
    
    const deletedCategory = await Category.findByIdAndDelete(id);
    
    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};