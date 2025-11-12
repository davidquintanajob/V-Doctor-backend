const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const Calendario = sequelize.define("calendario", {
  id_calendario: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id_paciente: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'pacientes',
      key: 'id_paciente'
    }
  },
  id_comerciable_servicio_complejo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'servicio_complejos',
      key: 'id_comerciable'
    }
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id_usuario'
    }
  }
}, {
  timestamps: true,
});

Calendario.associate = function (models) {
  Calendario.belongsTo(models.Paciente, { foreignKey: 'id_paciente' });
  Calendario.belongsTo(models.ServicioComplejo, { foreignKey: 'id_comerciable_servicio_complejo', targetKey: 'id_comerciable' });
  Calendario.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
};

module.exports = { Calendario };
