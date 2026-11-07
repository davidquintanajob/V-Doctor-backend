const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const Tarea = sequelize.define("tarea", {
  id_tarea: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  fecha_limite: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'preparado',
  },
  recordatorio_enviado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  timestamps: true,
});

Tarea.associate = function (models) {
  Tarea.belongsTo(models.Usuario, { foreignKey: { name: 'id_usuario', allowNull: true } });
  Tarea.hasMany(models.HistorialTarea, { foreignKey: 'id_tarea' });
};

module.exports = { Tarea };
