const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const HistorialTarea = sequelize.define("historial_tarea", {
  id_historial_tarea: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  id_tarea: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tareas',
      key: 'id_tarea'
    }
  },
}, {
  timestamps: true,
});

HistorialTarea.associate = function (models) {
  HistorialTarea.belongsTo(models.Tarea, { foreignKey: 'id_tarea' });
};

module.exports = { HistorialTarea };
