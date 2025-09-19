const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'La descripción no puede exceder 200 caracteres']
  },
  icon: {
    type: String,
    trim: true,
    maxlength: [10, 'El icono no puede exceder 10 caracteres']
  },
  sortOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índice para búsquedas
categorySchema.index({ name: 1 });
categorySchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);