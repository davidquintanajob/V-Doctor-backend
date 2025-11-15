const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const formasDePago = ["Efectivo", "Transferencia", "Pago en linea"];

const Venta = sequelize.define("venta", {
  id_venta: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  precio_original_comerciable_cup: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('precio_original_comerciable_cup', Math.round(value * 100) / 100);
    }
  },
  precio_original_comerciable_usd: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('precio_original_comerciable_usd', Math.round(value * 100) / 100);
    }
  },
  costo_producto_cup: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    set(value) {
      this.setDataValue('costo_producto_cup', Math.round(value * 100) / 100);
    }
  },
  cantidad: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('cantidad', Math.round(value * 100) / 100);
    }
  },
  precio_cobrado_cup: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('precio_cobrado_cup', Math.round(value * 100) / 100);
    }
  },
  forma_pago: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: {
        args: [formasDePago],
        msg: "La forma de pago especificada no es válida",
      },
    },
  },
  nota: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id_cliente'
    }
  },
  id_consulta: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'consultas',
      key: 'id_consulta'
    }
  },
  id_servicio_complejo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'servicio_complejos', // table name
      key: 'id_comerciable'      // target column
    }
  },
  id_comerciable: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comerciables',
      key: 'id_comerciable'
    }
  },
}, {
  timestamps: true,
});

Venta.associate = function (models) {
  Venta.belongsTo(models.Cliente, { foreignKey: 'id_cliente' });
  Venta.belongsToMany(models.Usuario, { through: models.VentaUsuario, foreignKey: 'id_venta' });
  Venta.belongsTo(models.Consulta, { foreignKey: 'id_consulta' });
  Venta.belongsTo(models.ServicioComplejo, { foreignKey: 'id_servicio_complejo', targetKey: 'id_comerciable' });
  Venta.belongsTo(models.Comerciable, { foreignKey: 'id_comerciable' });
};

module.exports = { Venta, formasDePago };
