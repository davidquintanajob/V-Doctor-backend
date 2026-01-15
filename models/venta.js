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
      this.setDataValue('precio_original_comerciable_cup', 
        Math.round(parseFloat(value) * 100000) / 100000
      );
    }
  },
  precio_original_comerciable_usd: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('precio_original_comerciable_usd', 
        Math.round(parseFloat(value) * 100000) / 100000
      );
    }
  },
  costo_producto_cup: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    set(value) {
      this.setDataValue('costo_producto_cup', 
        Math.round(parseFloat(value) * 100000) / 100000
      );
    }
  },
  cantidad: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('cantidad', 
        Math.round(parseFloat(value) * 100000) / 100000
      );
    }
  },
  precio_cobrado_cup: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    set(value) {
      this.setDataValue('precio_cobrado_cup', 
        Math.round(parseFloat(value) * 100000) / 100000
      );
    }
  },
  exedente_redondeo: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
    set(value) {
      this.setDataValue('exedente_redondeo', 
        Math.round(parseFloat(value) * 100000) / 100000
      );
    }
  },
  descuento: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
    set(value) {
      this.setDataValue('descuento', 
        Math.round(parseFloat(value) * 100000) / 100000
      );
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
      model: 'consulta',
      key: 'id_consulta'
    }
  },
  id_servicio_complejo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'servicio_complejos',
      key: 'id_comerciable'
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
  id_venta_relacionada: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      model: 'venta',
      key: 'id_venta'
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
  Venta.hasMany(models.FotoServicioComplejo, { foreignKey: 'id_venta', sourceKey: 'id_venta' });
  // Relaciones consigo misma
  Venta.belongsTo(models.Venta, { as: 'VentaRelacionada', foreignKey: 'id_venta_relacionada' });
  Venta.hasMany(models.Venta, { as: 'VentasRelacionadas', foreignKey: 'id_venta_relacionada' });
};

module.exports = { Venta, formasDePago };