const tareaService = require('../services/tareaService');

const getAllTareas = async (req, res) => {
  try {
    const tareas = await tareaService.getAllTareas();
    res.status(200).json(tareas);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const getTareaById = async (req, res) => {
  try {
    const { id } = req.params;
    const tarea = await tareaService.getTareaById(id);
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.status(200).json(tarea);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const createTarea = async (req, res) => {
  try {
    const { titulo, descripcion, fecha_creacion, estado, id_usuario } = req.body;
    const errors = [];

    if (!titulo) errors.push('titulo es requerido');
    if (!fecha_creacion) errors.push('fecha_creacion es requerida');

    if (errors.length) return res.status(400).json({ errors });

    const tareaData = {
      titulo,
      descripcion,
      fecha_creacion,
      estado,
      id_usuario
    };

    const newTarea = await tareaService.createTarea(tareaData);
    res.status(201).json(newTarea);
  } catch (error) {
    console.error('Error en createTarea controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear tarea'];
    res.status(status).json({ errors: errs });
  }
};

const updateTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, fecha_creacion, estado, id_usuario } = req.body;
    const errors = [];

    // Validaciones opcionales para actualización
    if (titulo !== undefined && !titulo) errors.push('titulo no puede estar vacío');
    if (fecha_creacion !== undefined && !fecha_creacion) errors.push('fecha_creacion no puede estar vacía');

    if (errors.length) return res.status(400).json({ errors });

    const tareaData = {
      titulo,
      descripcion,
      fecha_creacion,
      estado,
      id_usuario
    };

    // Eliminar campos undefined
    Object.keys(tareaData).forEach(key => tareaData[key] === undefined && delete tareaData[key]);

    const updated = await tareaService.updateTarea(id, tareaData);
    if (!updated) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error en updateTarea controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al actualizar tarea'];
    res.status(status).json({ errors: errs });
  }
};

const deleteTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await tareaService.deleteTarea(id);
    if (!deleted) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.status(200).json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al eliminar tarea'];
    res.status(status).json({ errors: errs });
  }
};

const filterTareas = async (req, res) => {
  try {
    const { limit, page } = req.params;
    const filterCriteria = req.body || {};

    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
    }

    const offset = (pageNum - 1) * limitNum;
    const { rows: tareas, count: total } = await tareaService.filterTareasPaginated(filterCriteria, limitNum, offset);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({ data: tareas, pagination: { total, currentPage: pageNum, limit: limitNum, totalPages } });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

module.exports = {
  getAllTareas,
  getTareaById,
  createTarea,
  updateTarea,
  deleteTarea,
  filterTareas
};

