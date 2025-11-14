const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const Servicio = sequelize.define("servicio", {
  id_comerciable: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
        model: 'comerciables',
        key: 'id_comerciable'
    }
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: true,
});

Servicio.associate = function (models) {
    Servicio.belongsTo(models.Comerciable, { foreignKey: 'id_comerciable', as: "comerciable" });
    Servicio.hasOne(models.ServicioComplejo, { foreignKey: 'id_comerciable', as: "servicio_complejo" });
};

module.exports = { Servicio };
