const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const TIPOS_SERVICIO = ["Estética y baño", "Operación", "Dental", "Otros"];

const ServicioComplejo = sequelize.define("servicio_complejo", {
  id_comerciable: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
        model: 'servicios',
        key: 'id_comerciable'
    }
  },
  tipo_servicio: {
    type: DataTypes.ENUM(...TIPOS_SERVICIO),
    allowNull: false,
  }
}, {
  timestamps: true,
});

ServicioComplejo.associate = function (models) {
    ServicioComplejo.belongsTo(models.Servicio, { foreignKey: 'id_comerciable' });
    ServicioComplejo.hasMany(models.Venta, { foreignKey: 'id_servicio_complejo', sourceKey: 'id_comerciable', as: 'venta' });
    ServicioComplejo.hasMany(models.FotoServicioComplejo, { foreignKey: 'id_comerciable_servicio_complejo', sourceKey: 'id_comerciable' });
    ServicioComplejo.hasMany(models.Calendario, { foreignKey: 'id_comerciable_servicio_complejo', sourceKey: 'id_comerciable' });
};

module.exports = { ServicioComplejo, TIPOS_SERVICIO };
