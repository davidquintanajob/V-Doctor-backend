const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const Comerciable = sequelize.define("comerciable", {
  id_comerciable: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  precio_usd: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('precio_usd', Math.round(value * 100) / 100);
    }
  },
  precio_cup: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('precio_cup', Math.round(value * 100) / 100);
    }
  },
  roles_autorizados: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

Comerciable.associate = function (models) {
  Comerciable.hasOne(models.Producto, { foreignKey: 'id_comerciable' });
  Comerciable.hasOne(models.Servicio, { foreignKey: 'id_comerciable' });
  Comerciable.hasMany(models.Venta, { foreignKey: 'id_comerciable' });
};

module.exports = { Comerciable };
