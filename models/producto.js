const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const Producto = sequelize.define("producto", {
  id_comerciable: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'comerciables',
      key: 'id_comerciable'
    }
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  costo_usd: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('costo_usd', Math.round(value * 100) / 100);
    }
  },
  costo_cup: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('costo_cup', Math.round(value * 100) / 100);
    }
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nota: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  codigo: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
  },
  cantidad: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0.0,
  },
}, {
  timestamps: true,
});

Producto.associate = function (models) {
  Producto.belongsTo(models.Comerciable, { foreignKey: 'id_comerciable' });
  Producto.hasMany(models.Entrada, { foreignKey: 'id_comerciable', as: 'entradas' });
  Producto.hasOne(models.Medicamento, { foreignKey: 'id_comerciable' });
};

module.exports = { Producto };
