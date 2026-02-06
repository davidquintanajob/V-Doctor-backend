const { HistorialPeso } = require('../models/historial_peso');
const { Paciente } = require('../models/paciente');
const sequelize = require('../helpers/database');
const { Op } = require('sequelize');

const getHistorialPesoById = async (id, transaction) => {
  return await HistorialPeso.findOne({
    where: { id_historial_peso: id },
    include: [{ model: Paciente, required: true }],
    transaction,
  });
};

const getAllHistorialPesos = async () => {
  return await HistorialPeso.findAll({ include: [{ model: Paciente, required: true }] });
};

const createHistorialPeso = async (data) => {
  const t = await sequelize.transaction();
  try {
    const created = await HistorialPeso.create(data, { transaction: t });
    await t.commit();
    return await getHistorialPesoById(created.id_historial_peso);
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio createHistorialPeso:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear historial de peso');
      err.errors = [error.message || 'Error interno al crear historial de peso'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const updateHistorialPeso = async (id, data) => {
  const t = await sequelize.transaction();
  try {
    const registro = await HistorialPeso.findOne({ where: { id_historial_peso: id }, transaction: t });
    if (!registro) {
      await t.rollback();
      const error = new Error(`Historial de peso con ID ${id} no encontrado`);
      error.status = 404;
      throw error;
    }

    await registro.update(data, { transaction: t });
    await t.commit();
    return await getHistorialPesoById(id);
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio updateHistorialPeso:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al actualizar historial de peso');
      err.errors = [error.message || 'Error interno al actualizar historial de peso'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const deleteHistorialPeso = async (id) => {
  const t = await sequelize.transaction();
  try {
    const registro = await HistorialPeso.findOne({ where: { id_historial_peso: id }, transaction: t });
    if (!registro) {
      await t.rollback();
      return false;
    }
    await registro.destroy({ transaction: t });
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio deleteHistorialPeso:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al eliminar historial de peso');
      err.errors = [error.message || 'Error interno al eliminar historial de peso'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const filterHistorialPesoPaginated = async (filterCriteria, limit, offset) => {
  try {
    const whereHistorial = {};
    const wherePaciente = {};

    if (filterCriteria) {
      const { fecha_inicio, fecha_fin, unidad_medida, id_paciente, nombre_paciente } = filterCriteria;

      if (fecha_inicio && fecha_fin) {
        whereHistorial.fecha = { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)] };
      } else if (fecha_inicio) {
        whereHistorial.fecha = { [Op.gte]: new Date(fecha_inicio) };
      } else if (fecha_fin) {
        whereHistorial.fecha = { [Op.lte]: new Date(fecha_fin) };
      }

      if (unidad_medida) whereHistorial.unidad_medida = { [Op.iLike]: `%${unidad_medida}%` };
      if (id_paciente) {
        const idp = parseInt(id_paciente, 10);
        if (!isNaN(idp)) whereHistorial.id_paciente = idp;
      }
      if (nombre_paciente) wherePaciente.nombre = { [Op.iLike]: `%${nombre_paciente}%` };
    }

    const result = await HistorialPeso.findAndCountAll({
      where: whereHistorial,
      limit,
      offset,
      include: [{ model: Paciente, required: true, where: wherePaciente }],
      order: [['createdAt', 'DESC'], ['fecha', 'DESC']]
    });

    return result;
  } catch (error) {
    console.error('Error en servicio filterHistorialPesoPaginated:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al filtrar historial de peso');
      err.errors = [error.message || 'Error interno al filtrar historial de peso'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

module.exports = {
  getAllHistorialPesos,
  getHistorialPesoById,
  createHistorialPeso,
  updateHistorialPeso,
  deleteHistorialPeso,
  filterHistorialPesoPaginated,
};
