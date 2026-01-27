const { Calendario } = require('../models/calendario');
const { Usuario } = require('../models/usuario');
const { Paciente } = require('../models/paciente');
const { Cliente } = require('../models/cliente');
const sequelize = require('../helpers/database');
const { Op, fn, col, where: seqWhere } = require('sequelize');

const getAllCalendarios = async () => {
  try {
    const items = await Calendario.findAll({
      include: [
        { model: Usuario, required: false },
        { model: Paciente, required: false, include: [ { model: Cliente, required: false } ] }
      ],
      order: [['fecha', 'ASC']]
    });
    return items;
  } catch (error) {
    console.error('Error en servicio getAllCalendarios:', error);
    const err = new Error(error.message || 'Error interno al obtener calendarios');
    err.errors = [error.message || 'Error interno al obtener calendarios'];
    err.status = error.status || 500;
    throw err;
  }
};

const getCalendarioById = async (id) => {
  try {
    const item = await Calendario.findOne({
      where: { id_calendario: id },
      include: [
        { model: Usuario, required: false },
        { model: Paciente, required: false, include: [ { model: Cliente, required: false } ] }
      ]
    });
    return item;
  } catch (error) {
    console.error('Error en servicio getCalendarioById:', error);
    const err = new Error(error.message || 'Error interno al obtener calendario');
    err.errors = [error.message || 'Error interno al obtener calendario'];
    err.status = error.status || 500;
    throw err;
  }
};

const createCalendario = async (data) => {
  try {
    const newItem = await Calendario.create(data);
    const created = await getCalendarioById(newItem.id_calendario);
    return created;
  } catch (error) {
    console.error('Error en servicio createCalendario:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear calendario');
      err.errors = [error.message || 'Error interno al crear calendario'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const updateCalendario = async (id, data) => {
  try {
    const item = await Calendario.findOne({ where: { id_calendario: id } });
    if (!item) return null;
    await item.update(data);
    return await getCalendarioById(id);
  } catch (error) {
    console.error('Error en servicio updateCalendario:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al actualizar calendario');
      err.errors = [error.message || 'Error interno al actualizar calendario'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const deleteCalendario = async (id) => {
  const t = await sequelize.transaction();
  try {
    const item = await Calendario.findOne({ where: { id_calendario: id }, transaction: t });
    if (!item) {
      await t.rollback();
      return false;
    }
    await item.destroy({ transaction: t });
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio deleteCalendario:', error);
    const err = new Error(error.message || 'Error interno al eliminar calendario');
    err.errors = [error.message || 'Error interno al eliminar calendario'];
    err.status = error.status || 500;
    throw err;
  }
};

const filterCalendarios = async (criteria) => {
  try {
    const where = {};
    const include = [
      { model: Usuario, required: false },
      { model: Paciente, required: false, include: [ { model: Cliente, required: false } ] }
    ];

    if (criteria.id_paciente) where.id_paciente = criteria.id_paciente;
    if (criteria.id_usuario) where.id_usuario = criteria.id_usuario;
    if (criteria.descripcion) where.descripcion = { [Op.iLike]: `%${String(criteria.descripcion).trim()}%` };

    // Fecha rango — comparar solo la parte fecha (sin hora) usando DATE(fecha)
    if (criteria.fecha_inicio && criteria.fecha_fin) {
      const inicioStr = String(criteria.fecha_inicio).trim();
      const finStr = String(criteria.fecha_fin).trim();
      if (inicioStr !== '' && finStr !== '') {
        const dateCondition = seqWhere(fn('DATE', col('fecha')), { [Op.between]: [inicioStr, finStr] });
        // combinar con otras condiciones si las hay
        if (!where[Op.and]) where[Op.and] = [];
        where[Op.and].push(dateCondition);
      }
    } else if (criteria.fecha_inicio) {
      const inicioStr = String(criteria.fecha_inicio).trim();
      if (inicioStr !== '') {
        const dateCondition = seqWhere(fn('DATE', col('fecha')), { [Op.gte]: inicioStr });
        if (!where[Op.and]) where[Op.and] = [];
        where[Op.and].push(dateCondition);
      }
    } else if (criteria.fecha_fin) {
      const finStr = String(criteria.fecha_fin).trim();
      if (finStr !== '') {
        const dateCondition = seqWhere(fn('DATE', col('fecha')), { [Op.lte]: finStr });
        if (!where[Op.and]) where[Op.and] = [];
        where[Op.and].push(dateCondition);
      }
    }

    // Filtros por nombre en includes
    if (criteria.nombre_usuario && String(criteria.nombre_usuario).trim() !== '') {
      include[0].where = { nombre_usuario: { [Op.iLike]: `%${String(criteria.nombre_usuario).trim()}%` } };
      include[0].required = true;
    }
    if (criteria.nombre_paciente && String(criteria.nombre_paciente).trim() !== '') {
      include[1].where = { nombre: { [Op.iLike]: `%${String(criteria.nombre_paciente).trim()}%` } };
      include[1].required = true;
    }

    const items = await Calendario.findAll({ where, include, order: [['fecha', 'ASC']] });
    return items;
  } catch (error) {
    console.error('Error en servicio filterCalendarios:', error);
    const err = new Error(error.message || 'Error interno al filtrar calendarios');
    err.errors = [error.message || 'Error interno al filtrar calendarios'];
    err.status = error.status || 500;
    throw err;
  }
};

module.exports = {
  getAllCalendarios,
  getCalendarioById,
  createCalendario,
  updateCalendario,
  deleteCalendario,
  filterCalendarios,
};
