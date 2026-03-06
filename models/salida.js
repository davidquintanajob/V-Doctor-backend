const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const Salida = sequelize.define("salida", {
  id_salida: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cantidad: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  costo_producto_cup: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  costo_producto_usd: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  cambio_moneda: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  nota: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  id_comerciable: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id_comerciable'
    }
  },
});

Salida.associate = function(models) {
  Salida.belongsTo(models.Producto, { foreignKey: 'id_comerciable', as: 'producto' });
};

module.exports = { Salida };