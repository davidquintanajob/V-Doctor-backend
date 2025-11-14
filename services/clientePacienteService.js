const { ClientePaciente } = require('../models/cliente_paciente');
const { Cliente } = require('../models/cliente');
const { Paciente } = require('../models/paciente');
const sequelize = require('../helpers/database');

const getAll = async () => {
  try {
    return await ClientePaciente.findAll();
  } catch (error) {
    console.error('Error en servicio getAll cliente_paciente:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener relaciones cliente_paciente');
      err.errors = [error.message || 'Error interno al obtener relaciones cliente_paciente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getByIds = async (id_cliente, id_paciente) => {
  return await ClientePaciente.findOne({ where: { id_cliente, id_paciente } });
};

const createRelation = async (data) => {
  try {
    const { id_cliente, id_paciente } = data;
    return await ClientePaciente.create({ id_cliente, id_paciente });
  } catch (error) {
    console.error('Error en servicio create cliente_paciente:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear relación cliente_paciente');
      err.errors = [error.message || 'Error interno al crear relación cliente_paciente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const deleteRelation = async (id_cliente, id_paciente) => {
  const t = await sequelize.transaction();
  try {
    const rel = await ClientePaciente.findOne({ where: { id_cliente, id_paciente }, transaction: t });
    if (!rel) {
      await t.rollback();
      return false;
    }
    await ClientePaciente.destroy({ where: { id_cliente, id_paciente }, transaction: t });
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio delete cliente_paciente:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al eliminar relación cliente_paciente');
      err.errors = [error.message || 'Error interno al eliminar relación cliente_paciente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

// Update: replace existing relation with new ids (delete + create) inside transaction
const updateRelation = async (oldClienteId, oldPacienteId, newData) => {
  const t = await sequelize.transaction();
  try {
    const rel = await ClientePaciente.findOne({ where: { id_cliente: oldClienteId, id_paciente: oldPacienteId }, transaction: t });
    if (!rel) {
      await t.rollback();
      return null;
    }
    const { id_cliente: newClienteId, id_paciente: newPacienteId } = newData;
    // delete old
    await ClientePaciente.destroy({ where: { id_cliente: oldClienteId, id_paciente: oldPacienteId }, transaction: t });
    // create new
    const created = await ClientePaciente.create({ id_cliente: newClienteId, id_paciente: newPacienteId }, { transaction: t });
    await t.commit();
    return created;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio update cliente_paciente:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al actualizar relación cliente_paciente');
      err.errors = [error.message || 'Error interno al actualizar relación cliente_paciente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getClientsByPatientId = async (id_paciente) => {
  try {
    const clientes = await Cliente.findAll({
      include: [{ model: Paciente, where: { id_paciente }, through: { attributes: [] }, required: true }]
    });
    return clientes;
  } catch (error) {
    console.error('Error en servicio getClientsByPatientId:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener clientes por paciente');
      err.errors = [error.message || 'Error interno al obtener clientes por paciente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getPatientsByClientId = async (id_cliente) => {
  try {
    const pacientes = await Paciente.findAll({
      include: [{ model: Cliente, where: { id_cliente }, through: { attributes: [] }, required: true }]
    });
    return pacientes;
  } catch (error) {
    console.error('Error en servicio getPatientsByClientId:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener pacientes por cliente');
      err.errors = [error.message || 'Error interno al obtener pacientes por cliente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

module.exports = {
  getAll,
  getByIds,
  createRelation,
  deleteRelation,
  updateRelation,
  getClientsByPatientId,
  getPatientsByClientId
};
