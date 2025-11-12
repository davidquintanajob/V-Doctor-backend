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
  id_comerciable_servicio_complejo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'servicio_complejos',
      key: 'id_comerciable'
    }
  }
}, {
  timestamps: true,
});

FotoServicioComplejo.associate = function (models) {
  FotoServicioComplejo.belongsTo(models.ServicioComplejo, { foreignKey: 'id_comerciable_servicio_complejo', targetKey: 'id_comerciable' });
};

module.exports = { FotoServicioComplejo };
