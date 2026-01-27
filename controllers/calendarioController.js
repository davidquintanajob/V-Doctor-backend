const calendarioService = require('../services/calendarioService');

const getAllCalendarios = async (req, res) => {
  try {
    const items = await calendarioService.getAllCalendarios();
    res.status(200).json(items);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const getCalendarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await calendarioService.getCalendarioById(id);
    if (!item) return res.status(404).json({ error: 'Calendario no encontrado' });
    res.status(200).json(item);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const createCalendario = async (req, res) => {
  try {
    const { fecha, descripcion, id_paciente, id_comerciable_servicio_complejo, id_usuario } = req.body;
    const errors = [];
    if (!fecha) errors.push('fecha es requerida');
    if (!descripcion) errors.push('descripcion es requerida');
    if (!id_usuario) errors.push('id_usuario es requerido');
    if (errors.length) return res.status(400).json({ errors });

    const data = { fecha, descripcion, id_paciente, id_comerciable_servicio_complejo, id_usuario };
    const created = await calendarioService.createCalendario(data);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error en createCalendario controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear calendario'];
    res.status(status).json({ errors: errs });
  }
};

const updateCalendario = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, descripcion, id_paciente, id_comerciable_servicio_complejo, id_usuario } = req.body;
    const errors = [];
    if (!fecha) errors.push('fecha es requerida');
    if (!descripcion) errors.push('descripcion es requerida');
    if (!id_usuario) errors.push('id_usuario es requerido');
    if (errors.length) return res.status(400).json({ errors });

    const data = { fecha, descripcion, id_paciente, id_comerciable_servicio_complejo, id_usuario };
    const updated = await calendarioService.updateCalendario(id, data);
    if (!updated) return res.status(404).json({ error: 'Calendario no encontrado' });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error en updateCalendario controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al actualizar calendario'];
    res.status(status).json({ errors: errs });
  }
};

const deleteCalendario = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await calendarioService.deleteCalendario(id);
    if (!deleted) return res.status(404).json({ error: 'Calendario no encontrado' });
    res.status(200).json({ message: 'Calendario eliminado correctamente' });
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al eliminar calendario'];
    res.status(status).json({ errors: errs });
  }
};

const filterCalendarios = async (req, res) => {
  try {
    const criteria = req.body || {};
    const items = await calendarioService.filterCalendarios(criteria);
    res.status(200).json(items);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
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
