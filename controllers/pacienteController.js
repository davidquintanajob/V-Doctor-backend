const pacienteService = require('../services/pacienteService');
const { especies, motivosFallecimiento } = require('../models/paciente');

const getAllPacientes = async (req, res) => {
  try {
    const pacientes = await pacienteService.getAllPacientes();
    res.status(200).json(pacientes);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const getPacienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await pacienteService.getPacienteById(id);
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.status(200).json(paciente);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const createPaciente = async (req, res) => {
  try {
    const { nombre, sexo, raza, especie, fecha_nacimiento, comprado_adoptado, historia_clinica, motivo_fallecimiento, chip, agresividad, descuento, imagen } = req.body;
    const errors = [];

    if (!nombre) errors.push('nombre es requerido');
    if (!sexo) errors.push('sexo es requerido');
    if (sexo && !['masculino', 'femenino', 'otros'].includes(sexo)) errors.push('sexo inválido');
    if (!raza) errors.push('raza es requerida');
    if (!especie) errors.push('especie es requerida');
    if (especie && !especies.includes(especie)) errors.push('especie inválida');
    if (!fecha_nacimiento) errors.push('fecha_nacimiento es requerida');
    if (comprado_adoptado && !['comprado', 'adoptado'].includes(comprado_adoptado)) errors.push('comprado_adoptado inválido');
    if (motivo_fallecimiento && !motivosFallecimiento.includes(motivo_fallecimiento)) errors.push('motivo_fallecimiento inválido');
    if (agresividad && (isNaN(agresividad) || agresividad < 0 || agresividad > 100)) errors.push('agresividad inválida (debe estar entre 0 y 100)');
    if (descuento && (isNaN(descuento) || descuento < 0 || descuento > 100)) errors.push('descuento inválido (debe estar entre 0 y 100)');

    if (errors.length) return res.status(400).json({ errors });

    const pacienteData = {
      nombre,
      sexo,
      raza,
      especie,
      fecha_nacimiento,
      comprado_adoptado,
      historia_clinica,
      motivo_fallecimiento,
      chip,
      agresividad,
      descuento,
      imagen
    };

    const newPaciente = await pacienteService.createPaciente(pacienteData);
    res.status(201).json(newPaciente);
  } catch (error) {
    console.error('Error en createPaciente controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear paciente'];
    res.status(status).json({ errors: errs });
  }
};

const updatePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, sexo, raza, especie, fecha_nacimiento, comprado_adoptado, historia_clinica, motivo_fallecimiento, chip, agresividad, descuento, imagen } = req.body;
    const errors = [];

    if (sexo && !['masculino', 'femenino', 'otros'].includes(sexo)) errors.push('sexo inválido');
    if (especie && !especies.includes(especie)) errors.push('especie inválida');
    if (comprado_adoptado && !['comprado', 'adoptado'].includes(comprado_adoptado)) errors.push('comprado_adoptado inválido');
    if (motivo_fallecimiento && !motivosFallecimiento.includes(motivo_fallecimiento)) errors.push('motivo_fallecimiento inválido');
    if (agresividad && (isNaN(agresividad) || agresividad < 0 || agresividad > 100)) errors.push('agresividad inválida (debe estar entre 0 y 100)');
    if (descuento && (isNaN(descuento) || descuento < 0 || descuento > 100)) errors.push('descuento inválido (debe estar entre 0 y 100)');

    if (errors.length) return res.status(400).json({ errors });

    const pacienteData = {
      nombre,
      sexo,
      raza,
      especie,
      fecha_nacimiento,
      comprado_adoptado,
      historia_clinica,
      motivo_fallecimiento,
      chip,
      agresividad,
      descuento,
      imagen
    };

    const updated = await pacienteService.updatePaciente(id, pacienteData);
    if (!updated) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error en updatePaciente controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al actualizar paciente'];
    res.status(status).json({ errors: errs });
  }
};

const deletePaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await pacienteService.deletePaciente(id);
    if (!deleted) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.status(200).json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al eliminar paciente'];
    res.status(status).json({ errors: errs });
  }
};

const filterPacientes = async (req, res) => {
  try {
    const { limit, page } = req.params;
    const filterCriteria = req.body || {};

    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
    }

    const offset = (pageNum - 1) * limitNum;
    const { rows: pacientes, count: total } = await pacienteService.filterPacientesPaginated(filterCriteria, limitNum, offset);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({ data: pacientes, pagination: { total, currentPage: pageNum, limit: limitNum, totalPages } });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

// Crear paciente con lista de clientes (transaccional, inverso a createClienteWithPatients)
const createPacienteWithClients = async (req, res) => {
  try {
    const { nombre, sexo, raza, especie, fecha_nacimiento, comprado_adoptado, historia_clinica, motivo_fallecimiento, chip, agresividad, descuento, imagen, clientes } = req.body;
    const errors = [];

    if (!nombre) errors.push('nombre es requerido');
    if (!sexo) errors.push('sexo es requerido');
    if (sexo && !['masculino', 'femenino', 'otros'].includes(sexo)) errors.push('sexo inválido');
    if (!raza) errors.push('raza es requerida');
    if (!especie) errors.push('especie es requerida');
    if (especie && !especies.includes(especie)) errors.push('especie inválida');
    if (!fecha_nacimiento) errors.push('fecha_nacimiento es requerida');
    if (comprado_adoptado && !['comprado', 'adoptado'].includes(comprado_adoptado)) errors.push('comprado_adoptado inválido');
    if (motivo_fallecimiento && !motivosFallecimiento.includes(motivo_fallecimiento)) errors.push('motivo_fallecimiento inválido');
    if (agresividad && (isNaN(agresividad) || agresividad < 0 || agresividad > 100)) errors.push('agresividad inválida (debe estar entre 0 y 100)');
    if (descuento && (isNaN(descuento) || descuento < 0 || descuento > 100)) errors.push('descuento inválido (debe estar entre 0 y 100)');
    if (!Array.isArray(clientes)) errors.push('clientes debe ser una lista');

    if (errors.length) return res.status(400).json({ errors });

    // Validar cada cliente y construir mensajes claros por cliente
    const clienteErrors = [];
    const validClientes = [];
    for (let i = 0; i < clientes.length; i++) {
      const c = clientes[i];
      const errs = [];
      if (!c.nombre) errs.push('nombre es requerido');
      if (!c.telefono) errs.push('telefono es requerido');
      if (c.telefono && !/^[0-9+-]+$/.test(c.telefono)) errs.push('telefono solo puede contener dígitos, + y -');
      if (c.direccion && typeof c.direccion !== 'string') errs.push('direccion debe ser una cadena');
      if (c.direccion && c.direccion.length > 255) errs.push('direccion demasiado larga (max 255 caracteres)');

      if (errs.length) {
        const label = c && c.nombre ? `"${c.nombre}"` : `#${i + 1}`;
        clienteErrors.push(`Cliente ${label}: ${errs.join('; ')}`);
      } else {
        validClientes.push(c);
      }
    }

    if (clienteErrors.length) return res.status(400).json({ errors: clienteErrors });

    const pacienteData = {
      nombre,
      sexo,
      raza,
      especie,
      fecha_nacimiento,
      comprado_adoptado,
      historia_clinica,
      motivo_fallecimiento,
      chip,
      agresividad,
      descuento,
      imagen
    };

    const created = await pacienteService.createPacienteWithClients(pacienteData, validClientes);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error en createPacienteWithClients controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear paciente con clientes'];
    res.status(status).json({ errors: errs });
  }
};

module.exports = {
  getAllPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  deletePaciente,
  filterPacientes,
  createPacienteWithClients
};
