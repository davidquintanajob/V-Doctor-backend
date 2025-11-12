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
}, {
  timestamps: true,
});

Tarea.associate = function (models) {
  Tarea.belongsTo(models.Usuario, { foreignKey: { name: 'id_usuario', allowNull: false } });
  Tarea.hasMany(models.HistorialTarea, { foreignKey: 'id_tarea' });
};

module.exports = { Tarea };
