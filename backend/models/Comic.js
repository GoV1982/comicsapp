const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comic = sequelize.define('Comic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numero_edicion: {
    type: DataTypes.STRING,
    allowNull: false
  },
  editorial_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  genero: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subgenero: {
    type: DataTypes.STRING,
    allowNull: true
  },
  imagen_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Disponible'
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'comics',
  timestamps: false
});

module.exports = Comic;