const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const FotoServicioComplejo = sequelize.define("foto_servicio_complejo", {
  id_foto_servicio_complejo: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ruta: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nota: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ventas',
      key: 'id_venta'
    }
  }
}, {
  timestamps: true,
});

FotoServicioComplejo.associate = function (models) {
  FotoServicioComplejo.belongsTo(models.Venta, { foreignKey: 'id_venta', targetKey: 'id_venta' });
};

module.exports = { FotoServicioComplejo };
