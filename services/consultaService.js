const { Consulta } = require('../models/consulta');
const { Paciente } = require('../models/paciente');
const { Usuario } = require('../models/usuario');
const { FotoConsulta } = require('../models/foto_consulta');
const sequelize = require('../helpers/database');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

const getAllConsultas = async () => {
  try {
    const consultas = await Consulta.findAll({
      include: [
        { model: Paciente, required: false },
        { model: FotoConsulta, required: false },
        { model: Usuario, required: false }
      ]
    });
    return consultas;
  } catch (error) {
    console.error('Error en servicio getAllConsultas:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener consultas');
      err.errors = [error.message || 'Error interno al obtener consultas'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getConsultaById = async (id) => {
  try {
    const consulta = await Consulta.findOne({
      where: { id_consulta: id },
      include: [
        { model: Paciente, required: false },
        { model: FotoConsulta, required: false },
        { model: Usuario, required: false }
      ]
    });
    return consulta;
  } catch (error) {
    console.error('Error en servicio getConsultaById:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener consulta');
      err.errors = [error.message || 'Error interno al obtener consulta'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const createConsulta = async (consultaData) => {
  try {
    const newConsulta = await Consulta.create(consultaData);
    return await getConsultaById(newConsulta.id_consulta);
  } catch (error) {
    console.error('Error en servicio createConsulta:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear consulta');
      err.errors = [error.message || 'Error interno al crear consulta'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const updateConsulta = async (id, consultaData) => {
  try {
    const consulta = await Consulta.findOne({ where: { id_consulta: id } });
    if (!consulta) return null;
    await consulta.update(consultaData);
    return await getConsultaById(consulta.id_consulta);
  } catch (error) {
    console.error('Error en servicio updateConsulta:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al actualizar consulta');
      err.errors = [error.message || 'Error interno al actualizar consulta'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const deleteConsulta = async (id) => {
  const t = await sequelize.transaction();
  try {
    const consulta = await Consulta.findOne({
      where: { id_consulta: id },
      include: [
        { model: FotoConsulta, required: false }
      ],
      transaction: t
    });

    if (!consulta) {
      await t.rollback();
      return false;
    }

    // Eliminar fotos relacionadas primero
    await FotoConsulta.destroy({ where: { id_consulta: id }, transaction: t });

    // Luego eliminar la consulta
    await consulta.destroy({ transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio deleteConsulta:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al eliminar consulta');
      err.errors = [error.message || 'Error interno al eliminar consulta'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const filterConsultasPaginated = async (filterCriteria, limit, offset) => {
  try {
    const whereClause = {};
    const include = [
      { model: Paciente, required: false },
      { model: FotoConsulta, required: false },
      { model: Usuario, required: false }
    ];

    // Filtro por rango de fecha
    if (filterCriteria && filterCriteria.fecha_desde && filterCriteria.fecha_hasta) {
      whereClause.fecha = {
        [Op.between]: [new Date(filterCriteria.fecha_desde), new Date(filterCriteria.fecha_hasta)]
      };
      delete filterCriteria.fecha_desde;
      delete filterCriteria.fecha_hasta;
    } else if (filterCriteria && filterCriteria.fecha_desde) {
      whereClause.fecha = { [Op.gte]: new Date(filterCriteria.fecha_desde) };
      delete filterCriteria.fecha_desde;
    } else if (filterCriteria && filterCriteria.fecha_hasta) {
      whereClause.fecha = { [Op.lte]: new Date(filterCriteria.fecha_hasta) };
      delete filterCriteria.fecha_hasta;
    }

    // Filtro por nombre de paciente
    if (filterCriteria && filterCriteria.nombre_paciente) {
      include[0].where = { nombre: { [Op.iLike]: `%${filterCriteria.nombre_paciente}%` } };
      // Hacer la inclusión requerida para filtrar correctamente (INNER JOIN)
      include[0].required = true;
      delete filterCriteria.nombre_paciente;
    }

    // Filtro general 'descripcion' -> búsqueda en motivo, diagnostico, anamnesis, tratamiento, patologia
    if (filterCriteria && filterCriteria.descripcion) {
      const val = String(filterCriteria.descripcion);
      whereClause[Op.or] = [
        { motivo: { [Op.iLike]: `%${val}%` } },
        { diagnostico: { [Op.iLike]: `%${val}%` } },
        { anamnesis: { [Op.iLike]: `%${val}%` } },
        { tratamiento: { [Op.iLike]: `%${val}%` } },
        { patologia: { [Op.iLike]: `%${val}%` } }
      ];
      delete filterCriteria.descripcion;
    }

    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        if (filterCriteria[key] === undefined || filterCriteria[key] === null) continue;
        whereClause[key] = { [Op.iLike]: `%${String(filterCriteria[key]).toLowerCase()}%` };
      }
    }

    const result = await Consulta.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include,
      distinct: true
    });
    return result;
  } catch (error) {
    console.error('Error en servicio filterConsultasPaginated:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al filtrar consultas');
      err.errors = [error.message || 'Error interno al filtrar consultas'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

// Crea consulta con lista de fotos en transacción
const createConsultaWithPhotos = async (consultaData, fotosList) => {
  const t = await sequelize.transaction();
  try {
    // Crear consulta
    const newConsulta = await Consulta.create(consultaData, { transaction: t });

    const FOTOS_CARPETA_CONSULTA = process.env.FOTOS_CARPETA_CONSULTA || '/fotos/consulta';

    // Procesar y crear cada foto
    for (let i = 0; i < fotosList.length; i++) {
      const foto = fotosList[i];
      const imagenBase64 = foto.imagen;

      if (!imagenBase64) continue; // Si no hay imagen, continuar

      // Crear el nombre del archivo: {id_consulta}-{indice}
      const nombreArchivo = `${newConsulta.id_consulta}-${i + 1}`;
      const rutaCompleta = path.join(FOTOS_CARPETA_CONSULTA, nombreArchivo);

      // Guardar la imagen en el filesystem
      await fs.writeFile(path.join(__dirname, '..', rutaCompleta), imagenBase64, 'base64');

      // Crear registro en FotoConsulta con la ruta
      await FotoConsulta.create(
        {
          ruta: rutaCompleta,
          nota: foto.nota || null,
          id_consulta: newConsulta.id_consulta
        },
        { transaction: t }
      );
    }

    await t.commit();

    // Cargar consulta con relaciones para retorno
    const consultaWithRelations = await getConsultaById(newConsulta.id_consulta);
    return consultaWithRelations;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio createConsultaWithPhotos:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear consulta con fotos');
      err.errors = [error.message || 'Error interno al crear consulta con fotos'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

module.exports = {
  getAllConsultas,
  getConsultaById,
  createConsulta,
  updateConsulta,
  deleteConsulta,
  filterConsultasPaginated,
  createConsultaWithPhotos,
};
