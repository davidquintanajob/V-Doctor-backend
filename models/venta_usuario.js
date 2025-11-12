const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const VentaUsuario = sequelize.define("venta_usuario", {
  id_venta: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'ventas',
      key: 'id_venta'
    }
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'usuarios',
      key: 'id_usuario'
    }
  }
}, {
  timestamps: false
});

module.exports = { VentaUsuario };
