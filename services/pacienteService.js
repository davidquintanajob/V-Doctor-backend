const { Paciente, especies, motivosFallecimiento } = require('../models/paciente');
const { Cliente } = require('../models/cliente');
const { ClientePaciente } = require('../models/cliente_paciente');
const sequelize = require('../helpers/database');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

const getAllPacientes = async () => {
  try {
    const pacientes = await Paciente.findAll({
      include: [
        { model: Cliente, through: { attributes: [] }, required: false }
      ]
    });
    return pacientes;
  } catch (error) {
    console.error('Error en servicio getAllPacientes:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener pacientes');
      err.errors = [error.message || 'Error interno al obtener pacientes'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getPacienteById = async (id) => {
  try {
    const paciente = await Paciente.findOne({
      where: { id_paciente: id },
      include: [
        { model: Cliente, through: { attributes: [] }, required: false }
      ]
    });
    return paciente;
  } catch (error) {
    console.error('Error en servicio getPacienteById:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener paciente');
      err.errors = [error.message || 'Error interno al obtener paciente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const createPaciente = async (pacienteData) => {
  try {
    // Asegurar que no se permita numero_clinico ni foto_ruta en input
    if (pacienteData.numero_clinico) delete pacienteData.numero_clinico;
    if (pacienteData.foto_ruta) delete pacienteData.foto_ruta;

    const imagenBase64 = pacienteData.imagen;
    if (imagenBase64) delete pacienteData.imagen;

    // Obtener último numero_clinico
    let lastNumero = await Paciente.max('numero_clinico');
    if (!lastNumero || isNaN(lastNumero)) lastNumero = 0;
    pacienteData.numero_clinico = lastNumero + 1;

    const newPaciente = await Paciente.create(pacienteData);

    // Si viene imagen, guardarla
    if (imagenBase64) {
      const FOTOS_CARPETA_PACIENTE = process.env.FOTOS_CARPETA_PACIENTE || '/fotos/paciente';
      const imagePath = path.join(FOTOS_CARPETA_PACIENTE, `${newPaciente.id_paciente}`);
      await fs.writeFile(path.join(__dirname, '..', imagePath), imagenBase64, 'base64');
      await newPaciente.update({ foto_ruta: imagePath });
    }

    return newPaciente;
  } catch (error) {
    console.error('Error en servicio createPaciente:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear paciente');
      err.errors = [error.message || 'Error interno al crear paciente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const updatePaciente = async (id, pacienteData) => {
  try {
    const paciente = await Paciente.findOne({ where: { id_paciente: id } });
    if (!paciente) return null;

    // No permitir actualización de numero_clinico
    if (pacienteData.numero_clinico) delete pacienteData.numero_clinico;

    const imagenBase64 = pacienteData.imagen;
    if (imagenBase64) delete pacienteData.imagen;

    // Actualizar datos básicos
    await paciente.update(pacienteData);

    // Si viene imagen, guardarla y actualizar foto_ruta
    if (imagenBase64) {
      const FOTOS_CARPETA_PACIENTE = process.env.FOTOS_CARPETA_PACIENTE || '/fotos/paciente';
      const imagePath = path.join(FOTOS_CARPETA_PACIENTE, `${paciente.id_paciente}`);
      await fs.writeFile(path.join(__dirname, '..', imagePath), imagenBase64, 'base64');
      await paciente.update({ foto_ruta: imagePath });
    }

    return paciente;
  } catch (error) {
    console.error('Error en servicio updatePaciente:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al actualizar paciente');
      err.errors = [error.message || 'Error interno al actualizar paciente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const deletePaciente = async (id) => {
  const t = await sequelize.transaction();
  try {
    const paciente = await Paciente.findOne({
      where: { id_paciente: id },
      include: [
        { model: Cliente, through: { attributes: [] }, required: false }
      ],
      transaction: t
    });

    if (!paciente) {
      await t.rollback();
      return false;
    }

    // Eliminar relaciones en cliente_paciente primero
    await ClientePaciente.destroy({ where: { id_paciente: id }, transaction: t });

    // Luego eliminar el paciente
    await paciente.destroy({ transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio deletePaciente:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al eliminar paciente');
      err.errors = [error.message || 'Error interno al eliminar paciente'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const filterPacientesPaginated = async (filterCriteria, limit, offset) => {
  try {
    const whereClause = {};
    const include = [
      { model: Cliente, through: { attributes: [] }, required: false }
    ];

    // special filter by client name
    if (filterCriteria && filterCriteria.nombre_cliente) {
      include[0].where = { nombre: { [Op.iLike]: `%${filterCriteria.nombre_cliente}%` } };
      delete filterCriteria.nombre_cliente;
    }

    // special filter 'descripcion' -> search across nombre, raza, especie
    if (filterCriteria && filterCriteria.descripcion) {
      const val = String(filterCriteria.descripcion);
      whereClause[Op.or] = [
        { nombre: { [Op.iLike]: `%${val}%` } },
        { raza: { [Op.iLike]: `%${val}%` } },
        { especie: { [Op.iLike]: `%${val}%` } }
      ];
      delete filterCriteria.descripcion;
    }

    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        if (filterCriteria[key] === undefined || filterCriteria[key] === null) continue;
        whereClause[key] = { [Op.iLike]: `%${String(filterCriteria[key]).toLowerCase()}%` };
      }
    }

    const result = await Paciente.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include,
      distinct: true
    });
    return result;
  } catch (error) {
    console.error('Error en servicio filterPacientesPaginated:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al filtrar pacientes');
      err.errors = [error.message || 'Error interno al filtrar pacientes'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

// Crea paciente y lista de clientes en transacción (inverso a createClienteWithPatients)
const createPacienteWithClients = async (pacienteData, clientesList) => {
  const t = await sequelize.transaction();
  try {
    // Asegurar que no se permita numero_clinico ni foto_ruta en input
    if (pacienteData.numero_clinico) delete pacienteData.numero_clinico;
    if (pacienteData.foto_ruta) delete pacienteData.foto_ruta;

    const imagenBase64 = pacienteData.imagen;
    if (imagenBase64) delete pacienteData.imagen;

    // Obtener último numero_clinico
    let lastNumero = await Paciente.max('numero_clinico');
    if (!lastNumero || isNaN(lastNumero)) lastNumero = 0;
    pacienteData.numero_clinico = lastNumero + 1;

    // Crear paciente
    const newPaciente = await Paciente.create(pacienteData, { transaction: t });

    // Si viene imagen, guardarla
    if (imagenBase64) {
      const FOTOS_CARPETA_PACIENTE = process.env.FOTOS_CARPETA_PACIENTE || '/fotos/paciente';
      const imagePath = path.join(FOTOS_CARPETA_PACIENTE, `${newPaciente.id_paciente}`);
      await fs.writeFile(path.join(__dirname, '..', imagePath), imagenBase64, 'base64');
      await newPaciente.update({ foto_ruta: imagePath }, { transaction: t });
    }

    // Crear clientes y asociarlos
    for (const c of clientesList) {
      // Asegurar que no se permita foto_ruta ni ningún campo de paciente
      if (c.foto_ruta) delete c.foto_ruta;

      const clienteImagenBase64 = c.imagen;
      if (clienteImagenBase64) delete c.imagen;

      const newCliente = await Cliente.create(c, { transaction: t });

      // Si viene imagen del cliente, guardarla
      if (clienteImagenBase64) {
        const FOTOS_CARPETA_CLIENTE = process.env.FOTOS_CARPETA_CLIENTE || '/fotos/cliente';
        const imagePath = path.join(FOTOS_CARPETA_CLIENTE, `${newCliente.id_cliente}`);
        await fs.writeFile(path.join(__dirname, '..', imagePath), clienteImagenBase64, 'base64');
        await newCliente.update({ foto_ruta: imagePath }, { transaction: t });
      }

      // Asociar cliente con paciente
      await ClientePaciente.create(
        { id_cliente: newCliente.id_cliente, id_paciente: newPaciente.id_paciente },
        { transaction: t }
      );
    }

    await t.commit();

    // Cargar paciente con relaciones para retorno
    const pacienteWithRelations = await getPacienteById(newPaciente.id_paciente);
    return pacienteWithRelations;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio createPacienteWithClients:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear paciente con clientes');
      err.errors = [error.message || 'Error interno al crear paciente con clientes'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

module.exports = {
  getAllPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  deletePaciente,
  filterPacientesPaginated,
  createPacienteWithClients,
};
