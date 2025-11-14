const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const Cliente = sequelize.define("cliente", {
  id_cliente: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: /^[0-9+-]+$/,
        msg: "El teléfono solo debe contener dígitos (0-9) y los caracteres + y -",
      },
    },
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

Cliente.associate = function(models) {
    Cliente.hasMany(models.Venta, { foreignKey: 'id_cliente' });
    Cliente.belongsToMany(models.Paciente, { through: 'cliente_paciente', foreignKey: 'id_cliente' });
};

module.exports = { Cliente };
