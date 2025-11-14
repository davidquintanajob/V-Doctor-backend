const { Cliente } = require('../models/cliente');
const { Paciente, especies, motivosFallecimiento } = require('../models/paciente');
const { Venta } = require('../models/venta');
const { ClientePaciente } = require('../models/cliente_paciente');
const sequelize = require('../helpers/database');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

const getAllClientes = async () => {
  try {
    const clientes = await Cliente.findAll({
      include: [
        { model: Paciente, through: { attributes: [] }, required: false },
        { model: Venta, required: false }
      ]
    });
    return clientes;
  } catch (error) {
    console.error('Error en servicio getAllClientes:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener clientes');
      err.errors = [error.message || 'Error interno al obtener clientes'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getClienteById = async (id) => {
  return await Cliente.findOne({
    where: { id_cliente: id },
    include: [
      { model: Paciente, through: { attributes: [] }, required: false },
      { model: Venta, required: false }
    ]
  });
};

const createCliente = async (clienteData) => {
  try {
    return await Cliente.create(clienteData);
  } catch (error) {
    console.error('Error en servicio createCliente:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear cliente');
      err.errors = [error.message || 'Error interno al crear cliente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const updateCliente = async (id, clienteData) => {
  try {
    const cliente = await Cliente.findOne({ where: { id_cliente: id } });
    if (!cliente) return null;
    await cliente.update(clienteData);
    return cliente;
  } catch (error) {
    console.error('Error en servicio updateCliente:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al actualizar cliente');
      err.errors = [error.message || 'Error interno al actualizar cliente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const deleteCliente = async (id) => {
  const t = await sequelize.transaction();
  try {
    const cliente = await Cliente.findOne({
      where: { id_cliente: id },
      include: [
        { model: Venta, required: false },
        { model: Paciente, through: { attributes: [] }, required: false }
      ],
      transaction: t
    });

    if (!cliente) {
      await t.rollback();
      return false;
    }

    // Si tiene ventas asociadas, no permitir eliminación
    if (cliente.ventas && cliente.ventas.length > 0) {
      await t.rollback();
      const err = new Error('No se puede eliminar el cliente porque tiene ventas asociadas');
      err.status = 400;
      throw err;
    }

    // Eliminar relaciones en cliente_paciente primero
    await ClientePaciente.destroy({ where: { id_cliente: id }, transaction: t });

    // Luego eliminar el cliente
    await cliente.destroy({ transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio deleteCliente:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al eliminar cliente');
      err.errors = [error.message || 'Error interno al eliminar cliente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const filterClientesPaginated = async (filterCriteria, limit, offset) => {
  try {
    const whereClause = {};
    const include = [
      { model: Paciente, through: { attributes: [] }, required: false },
      { model: Venta, required: false }
    ];

    // special filter by patient name
    if (filterCriteria && filterCriteria.nombre_mascota) {
      include[0].where = { nombre: { [Op.iLike]: `%${filterCriteria.nombre_mascota}%` } };
      // remove this key so it doesn't interfere with cliente where clause
      delete filterCriteria.nombre_mascota;
    }

    // special filter 'descripcion' -> search across nombre, direccion, color
    if (filterCriteria && filterCriteria.descripcion) {
      const val = String(filterCriteria.descripcion);
      whereClause[Op.or] = [
        { nombre: { [Op.iLike]: `%${val}%` } },
        { direccion: { [Op.iLike]: `%${val}%` } },
        { color: { [Op.iLike]: `%${val}%` } }
      ];
      delete filterCriteria.descripcion;
    }

    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        // Skip empty keys
        if (filterCriteria[key] === undefined || filterCriteria[key] === null) continue;
        whereClause[key] = { [Op.iLike]: `%${String(filterCriteria[key]).toLowerCase()}%` };
      }
    }

    const result = await Cliente.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include,
      distinct: true
    });
    return result;
  } catch (error) {
    console.error('Error en servicio filterClientesPaginated:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al filtrar clientes');
      err.errors = [error.message || 'Error interno al filtrar clientes'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

// Crea cliente y lista de pacientes en transacción
const createClienteWithPatients = async (clienteData, pacientesList) => {
  const t = await sequelize.transaction();
  try {
    // crear cliente
    const newCliente = await Cliente.create(clienteData, { transaction: t });

    // obtener último numero_clinico
    let lastNumero = await Paciente.max('numero_clinico');
    if (!lastNumero || isNaN(lastNumero)) lastNumero = 0;

    const FOTOS_CARPETA_PACIENTE = process.env.FOTOS_CARPETA_PACIENTE || '/fotos/paciente';

    for (const p of pacientesList) {
      // asegurar que no se permita foto_ruta ni numero_clinico en input
      if (p.foto_ruta) delete p.foto_ruta;
      if (p.numero_clinico) delete p.numero_clinico;

      const pacientePayload = Object.assign({}, p);
      lastNumero += 1;
      pacientePayload.numero_clinico = lastNumero;

      const imagenBase64 = pacientePayload.imagen; // optional
      if (imagenBase64) delete pacientePayload.imagen;

      const newPaciente = await Paciente.create(pacientePayload, { transaction: t });

      // si viene imagen, guardarla y actualizar foto_ruta
      if (imagenBase64) {
        const imagePath = path.join(FOTOS_CARPETA_PACIENTE, `${newPaciente.id_paciente}`);
        await fs.writeFile(path.join(__dirname, '..', imagePath), imagenBase64, 'base64');
        await newPaciente.update({ foto_ruta: imagePath }, { transaction: t });
      }

      // relacionar en tabla cliente_paciente
      await ClientePaciente.create({ id_cliente: newCliente.id_cliente, id_paciente: newPaciente.id_paciente }, { transaction: t });
    }

    await t.commit();

    // cargar cliente con relaciones para retorno
    const clienteWithRelations = await getClienteById(newCliente.id_cliente);
    return clienteWithRelations;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio createClienteWithPatients:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear cliente con pacientes');
      err.errors = [error.message || 'Error interno al crear cliente con pacientes'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

module.exports = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  filterClientesPaginated,
  createClienteWithPatients,
};
