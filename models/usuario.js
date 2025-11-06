const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const Usuario = sequelize.define("usuario", {
  id_usuario: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nombre_usuario: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  carnet_identidad: {
    type: DataTypes.STRING,
    // Allow null temporarily to match DB state while we backfill existing rows.
    allowNull: false,
    unique: true,
    validate: {
      isNumeric: {
        msg: 'El carnet_identidad solo debe contener dígitos (0-9)'
      },
      len: {
        args: [11, 11],
        msg: 'El carnet_identidad debe tener exactamente 11 dígitos'
      }
    }
  },
  cargo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contrasenna: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false,
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
  Usuario.hasMany(models.Oferta, {
    foreignKey: 'id_usuario',
  });
  Usuario.hasMany(models.Factura, {
    foreignKey: 'id_usuario',
    as: 'facturas'
  });
  Usuario.hasMany(models.Salida, {
    foreignKey: 'id_usuario',
    as: 'salidas'
  });
};

module.exports = Usuario;