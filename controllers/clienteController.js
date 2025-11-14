const clienteService = require('../services/clienteService');
const { especies, motivosFallecimiento } = require('../models/paciente');

const getAllClientes = async (req, res) => {
  try {
    const clientes = await clienteService.getAllClientes();
    res.status(200).json(clientes);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await clienteService.getClienteById(id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.status(200).json(cliente);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const createCliente = async (req, res) => {
  try {
    const { nombre, telefono, color, direccion } = req.body;
    const errors = [];
    if (!nombre) errors.push('nombre es requerido');
    if (!telefono) errors.push('telefono es requerido');
    if (telefono && !/^[0-9+-]+$/.test(telefono)) errors.push('telefono solo puede contener dígitos, + y -');
    if (direccion && typeof direccion !== 'string') errors.push('direccion debe ser una cadena');
    if (direccion && direccion.length > 255) errors.push('direccion demasiado larga (max 255 caracteres)');
    if (errors.length) return res.status(400).json({ errors });

    const clienteData = { nombre, telefono, color, direccion };
    const newCliente = await clienteService.createCliente(clienteData);
    res.status(201).json(newCliente);
  } catch (error) {
    console.error('Error en createCliente controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear cliente'];
    res.status(status).json({ errors: errs });
  }
};

const updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, color, direccion } = req.body;
    const errors = [];
    if (telefono && !/^[0-9+-]+$/.test(telefono)) errors.push('telefono solo puede contener dígitos, + y -');
    if (direccion && typeof direccion !== 'string') errors.push('direccion debe ser una cadena');
    if (direccion && direccion.length > 255) errors.push('direccion demasiado larga (max 255 caracteres)');
    if (errors.length) return res.status(400).json({ errors });

    const updated = await clienteService.updateCliente(id, { nombre, telefono, color, direccion });
    if (!updated) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await clienteService.deleteCliente(id);
    if (!deleted) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.status(200).json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al eliminar cliente'];
    res.status(status).json({ errors: errs });
  }
};

const filterClientes = async (req, res) => {
  try {
    const { limit, page } = req.params;
    const filterCriteria = req.body || {};

    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
    }

    const offset = (pageNum - 1) * limitNum;
    const { rows: clientes, count: total } = await clienteService.filterClientesPaginated(filterCriteria, limitNum, offset);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({ data: clientes, pagination: { total, currentPage: pageNum, limit: limitNum, totalPages } });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

// Crear cliente con lista de pacientes (transaccional)
const createClienteWithPatients = async (req, res) => {
  try {
    const { nombre, telefono, color, direccion, pacientes } = req.body;
    const errors = [];
    if (!nombre) errors.push('nombre es requerido');
    if (!telefono) errors.push('telefono es requerido');
    if (telefono && !/^[0-9+-]+$/.test(telefono)) errors.push('telefono solo puede contener dígitos, + y -');
    if (direccion && typeof direccion !== 'string') errors.push('direccion debe ser una cadena');
    if (direccion && direccion.length > 255) errors.push('direccion demasiado larga (max 255 caracteres)');
    if (!Array.isArray(pacientes)) errors.push('pacientes debe ser una lista');
    if (errors.length) return res.status(400).json({ errors });

    // Validar cada paciente y construir mensajes claros por paciente
    const pacienteErrors = [];
    const validPacientes = [];
    for (let i = 0; i < pacientes.length; i++) {
      const p = pacientes[i];
      const errs = [];
      if (!p.nombre) errs.push('nombre es requerido');
      if (!p.sexo) errs.push('sexo es requerido');
      if (p.sexo && !['masculino', 'femenino', 'otros'].includes(p.sexo)) errs.push('sexo inválido');
      if (!p.raza) errs.push('raza es requerida');
      if (!p.especie) errs.push('especie es requerida');
      if (p.especie && !especies.includes(p.especie)) errs.push('especie inválida');
      if (!p.fecha_nacimiento) errs.push('fecha_nacimiento es requerida');
      if (p.motivo_fallecimiento && !motivosFallecimiento.includes(p.motivo_fallecimiento)) errs.push('motivo_fallecimiento inválido');
      if (p.agresividad && (isNaN(p.agresividad) || p.agresividad < 0 || p.agresividad > 100)) errs.push('agresividad inválida');
      if (p.descuento && (isNaN(p.descuento) || p.descuento < 0 || p.descuento > 100)) errs.push('descuento inválido');

      if (errs.length) {
        const label = p && p.nombre ? `"${p.nombre}"` : `#${i + 1}`;
        pacienteErrors.push(`Paciente ${label}: ${errs.join('; ')}`);
      } else {
        validPacientes.push(p);
      }
    }

    if (pacienteErrors.length) return res.status(400).json({ errors: pacienteErrors });

    const clienteData = { nombre, telefono, color, direccion };
    const created = await clienteService.createClienteWithPatients(clienteData, validPacientes);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error en createClienteWithPatients controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear cliente con pacientes'];
    res.status(status).json({ errors: errs });
  }
};

module.exports = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  filterClientes,
  createClienteWithPatients
};
