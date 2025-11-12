const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const HistorialPeso = sequelize.define("historial_peso", {
  id_historial_peso: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  peso: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('peso', Math.round(value * 100) / 100);
    }
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  unidad_medida: {
    type: DataTypes.STRING,
    allowNull: false,
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

HistorialPeso.associate = function (models) {
  HistorialPeso.belongsTo(models.Paciente, { foreignKey: 'id_paciente' });
};

module.exports = { HistorialPeso };
