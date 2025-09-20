const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * Obtener lista de productos con filtros
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      available,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Construir filtros
    let filter = {};

    if (category) {
      filter.category = category;
    }

    if (available !== undefined) {
      filter.isAvailable = available === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Configurar ordenamiento
    const sortOrder = order === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder };

    // Configurar paginación
    const skip = (page - 1) * limit;

    // Obtener productos
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Contar total para paginación
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: Number(page),
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
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
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
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
    const { 
      name, 
      price, 
      category, 
      description, 
      ingredients, 
      preparationTime,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spicyLevel
    } = req.body;
    
    // Validar que la categoría existe
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Categoría no válida'
      });
    }
    
    // Procesar ingredients si viene como string separado por comas
    let processedIngredients = [];
    if (ingredients) {
      if (Array.isArray(ingredients)) {
        processedIngredients = ingredients;
      } else if (typeof ingredients === 'string') {
        processedIngredients = ingredients.split(',').map(ing => ing.trim()).filter(ing => ing);
      }
    }
    
    // Crear producto
    const newProduct = new Product({
      name,
      price: Number(price),
      category,
      description,
      ingredients: processedIngredients,
      preparationTime: Number(preparationTime),
      isVegetarian: isVegetarian === 'true' || isVegetarian === true,
      isVegan: isVegan === 'true' || isVegan === true,
      isGlutenFree: isGlutenFree === 'true' || isGlutenFree === true,
      spicyLevel: spicyLevel ? Number(spicyLevel) : 0
    });
    
    await newProduct.save();
    
    // Poblar la categoría para la respuesta
    await newProduct.populate('category', 'name');
    
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
    const { 
      name, 
      price, 
      category, 
      description, 
      ingredients, 
      preparationTime,
      isVegetarian,
      isVegan,
      isGlutenFree,
      spicyLevel,
      isAvailable
    } = req.body;
    
    // Verificar que el producto existe
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Verificar categoría si se proporciona
    if (category && category !== currentProduct.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Categoría no válida'
        });
      }
    }
    
    // Preparar datos para actualizar
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (preparationTime !== undefined) updateData.preparationTime = Number(preparationTime);
    if (isVegetarian !== undefined) updateData.isVegetarian = isVegetarian === 'true' || isVegetarian === true;
    if (isVegan !== undefined) updateData.isVegan = isVegan === 'true' || isVegan === true;
    if (isGlutenFree !== undefined) updateData.isGlutenFree = isGlutenFree === 'true' || isGlutenFree === true;
    if (spicyLevel !== undefined) updateData.spicyLevel = Number(spicyLevel);
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
    
    // Procesar ingredients si se proporciona
    if (ingredients !== undefined) {
      if (Array.isArray(ingredients)) {
        updateData.ingredients = ingredients;
      } else if (typeof ingredients === 'string') {
        updateData.ingredients = ingredients.split(',').map(ing => ing.trim()).filter(ing => ing);
      }
    }
    
    // Actualizar producto
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true
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
    
    // Verificar que el producto existe
    const productToDelete = await Product.findById(id);
    
    if (!productToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
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