const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const roles = ["Administrador", "Médico", "Recepcionista", "Estilista"];

const Usuario = sequelize.define("usuario", {
  id_usuario: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre_natural: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nombre_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  contrasenna: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  salario_diario: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: {
        args: [roles],
        msg: "El rol especificado no es válido",
      },
    },
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  timestamps: true,
});

Usuario.associate = function(models) {
    Usuario.hasMany(models.Entrada, { foreignKey: 'id_usuario' });
    Usuario.belongsToMany(models.Venta, { through: models.VentaUsuario, foreignKey: 'id_usuario' });
    Usuario.hasMany(models.Tarea, { foreignKey: 'id_usuario' });
    Usuario.hasMany(models.Calendario, { foreignKey: 'id_usuario' });
};

module.exports = { Usuario, roles };
