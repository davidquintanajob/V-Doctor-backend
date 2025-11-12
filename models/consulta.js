const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const Consulta = sequelize.define("consulta", {
  id_consulta: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  diagnostico: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  anamnesis: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tratamiento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  patologia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  id_paciente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pacientes',
      key: 'id_paciente'
    }
  },
}, {
  timestamps: true,
});

Consulta.associate = function (models) {
  Consulta.belongsTo(models.Paciente, { foreignKey: 'id_paciente' });
  Consulta.hasMany(models.Venta, { foreignKey: 'id_consulta' });
  Consulta.hasMany(models.FotoConsulta, { foreignKey: 'id_consulta' });
};

module.exports = { Consulta };
