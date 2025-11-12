const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const ClientePaciente = sequelize.define("cliente_paciente", {
  id_cliente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'clientes',
      key: 'id_cliente'
    }
  },
  id_paciente: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'pacientes',
      key: 'id_paciente'
    }
  }
}, {
  timestamps: false
});

module.exports = { ClientePaciente };
