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
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id_usuario'
    }
  },
}, {
  timestamps: true,
});

Consulta.associate = function (models) {
  Consulta.belongsTo(models.Paciente, { foreignKey: 'id_paciente' });
  Consulta.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
  Consulta.hasMany(models.Venta, { foreignKey: 'id_consulta' });
  Consulta.hasMany(models.FotoConsulta, { 
  foreignKey: 'id_consulta',
  onDelete: 'CASCADE' // Importante para consistencia
});
};

module.exports = { Consulta };
