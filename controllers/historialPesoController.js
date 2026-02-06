const historialPesoService = require('../services/historialPesoService');

const getAllHistorial = async (req, res) => {
  try {
    const datos = await historialPesoService.getAllHistorialPesos();
    res.status(200).json(datos);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const getHistorialById = async (req, res) => {
  try {
    const { id } = req.params;
    const registro = await historialPesoService.getHistorialPesoById(id);
    if (!registro) return res.status(404).json({ error: 'Registro no encontrado' });
    res.status(200).json(registro);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const createHistorial = async (req, res) => {
  try {
    const { peso, fecha, unidad_medida, id_paciente } = req.body;
    const errors = [];
    if (peso === undefined || peso === null) errors.push('peso es requerido');
    if (!fecha) errors.push('fecha es requerida');
    if (!unidad_medida) errors.push('unidad_medida es requerida');
    if (!id_paciente) errors.push('id_paciente es requerido');
    if (errors.length) return res.status(400).json({ errors });

    const payload = { peso, fecha, unidad_medida, id_paciente };
    const created = await historialPesoService.createHistorialPeso(payload);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error en createHistorial controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear registro'];
    res.status(status).json({ errors: errs });
  }
};

const updateHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const { peso, fecha, unidad_medida, id_paciente } = req.body;
    const errors = [];
    if (peso === undefined || peso === null) errors.push('peso es requerido');
    if (!fecha) errors.push('fecha es requerida');
    if (!unidad_medida) errors.push('unidad_medida es requerida');
    if (!id_paciente) errors.push('id_paciente es requerido');
    if (errors.length) return res.status(400).json({ errors });

    const updated = await historialPesoService.updateHistorialPeso(id, { peso, fecha, unidad_medida, id_paciente });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error en updateHistorial controller:', error);
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const deleteHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await historialPesoService.deleteHistorialPeso(id);
    if (!deleted) return res.status(404).json({ error: 'Registro no encontrado' });
    res.status(200).json({ message: 'Registro eliminado correctamente' });
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al eliminar registro'];
    res.status(status).json({ errors: errs });
  }
};

const filterHistorial = async (req, res) => {
  try {
    const { limit, page } = req.params;
    const filterCriteria = req.body || {};
    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
    }
    const offset = (pageNum - 1) * limitNum;
    const { rows: data, count: total } = await historialPesoService.filterHistorialPesoPaginated(filterCriteria, limitNum, offset);
    const totalPages = Math.ceil(total / limitNum);
    res.status(200).json({ data, pagination: { total, currentPage: pageNum, limit: limitNum, totalPages } });
  } catch (error) {
    console.error('Error en filterHistorial controller:', error);
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

module.exports = {
  getAllHistorial,
  getHistorialById,
  createHistorial,
  updateHistorial,
  deleteHistorial,
  filterHistorial,
};
