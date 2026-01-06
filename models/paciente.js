const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database.js");

const especies = ["Canino", "Felino", "Ave", "Roedor", "Peces", "Caprino", "Porcino", "Ovino", "Otros"];
const motivosFallecimiento = ["Eutanasia", "Accidente", "Enfermedad", "Vejez", "Otros"];

const Paciente = sequelize.define("paciente", {
  id_paciente: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sexo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: {
        args: [["macho", "hembra", "otros"]],
        msg: "El sexo especificado no es válido",
      },
    },
  },
  raza: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  especie: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: {
        args: [especies],
        msg: "La especie especificada no es válida",
      },
    },
  },
  numero_clinico: { //Este dato se genera como un concecutivo único para cada paciente
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  comprado_adoptado: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: {
        args: [["comprado", "adoptado"]],
        msg: "El valor de comprado_adoptado no es válido",
      },
    },
  },
  historia_clinica: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  foto_ruta: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  motivo_fallecimiento: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: {
        args: [motivosFallecimiento],
        msg: "El motivo de fallecimiento especificado no es válido",
      },
    },
  },
  chip: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  agresividad: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  descuento: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
}, {
  timestamps: true,
});

Paciente.associate = function(models) {
    Paciente.belongsToMany(models.Cliente, { through: 'cliente_paciente', foreignKey: 'id_paciente' });
    Paciente.hasMany(models.HistorialPeso, { foreignKey: 'id_paciente' });
    Paciente.hasMany(models.Consulta, { foreignKey: 'id_paciente' });
    Paciente.hasMany(models.Calendario, { foreignKey: 'id_paciente' });
};

module.exports = { Paciente, especies, motivosFallecimiento };
