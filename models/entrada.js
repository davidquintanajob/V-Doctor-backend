const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const Entrada = sequelize.define("entrada", {
    id_entrada: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nombre_proveedor: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    cantidad: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        get() {
            const value = this.getDataValue('cantidad');
            return value ? parseFloat(value.toFixed(2)) : null;
        }
    },
    costo_cup: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        get() {
            const value = this.getDataValue('costo_cup');
            return value ? parseFloat(value.toFixed(2)) : null;
        }
    },
    costo_usd: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        get() {
            const value = this.getDataValue('costo_usd');
            return value ? parseFloat(value.toFixed(2)) : null;
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
    id_comerciable: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'productos',
            key: 'id_comerciable'
        }
    }
});

Entrada.associate = function(models) {
    Entrada.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
    Entrada.belongsTo(models.Producto, { foreignKey: 'id_comerciable' });
};

module.exports = { Entrada };
