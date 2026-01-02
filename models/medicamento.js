const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const tiposMedicamento = [
  "vacuna", "antiparasitario", "antibiótico", "digestivo", "vitaminico", 
  "anestesico", "sedante", "crema", "oftalmico", "otico", "energizante", 
  "inmuno estimulante", "anticeptico", "desinfectante", "antiinflamatorio", "analgésico"
];

const Medicamento = sequelize.define("medicamento", {
  id_comerciable: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'productos',
      key: 'id_comerciable'
    }
  },
  tipo_medicamento: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: {
        args: [tiposMedicamento],
        msg: "El tipo de medicamento especificado no es válido",
      },
    },
  },
  unidad_medida: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  posologia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

Medicamento.associate = function (models) {
  Medicamento.belongsTo(models.Producto, { foreignKey: 'id_comerciable' });
};

module.exports = { Medicamento, tiposMedicamento };
