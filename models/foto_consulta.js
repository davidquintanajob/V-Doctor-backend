const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const FotoConsulta = sequelize.define("foto_consulta", {
  id_foto_consulta: {
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
  id_consulta: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'consultas',
      key: 'id_consulta'
    }
  },
}, {
  timestamps: true,
});

FotoConsulta.associate = function (models) {
  FotoConsulta.belongsTo(models.Consulta, { foreignKey: 'id_consulta' });
};

module.exports = { FotoConsulta };
