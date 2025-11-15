const consultaService = require('../services/consultaService');

const getAllConsultas = async (req, res) => {
  try {
    const consultas = await consultaService.getAllConsultas();
    res.status(200).json(consultas);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const getConsultaById = async (req, res) => {
  try {
    const { id } = req.params;
    const consulta = await consultaService.getConsultaById(id);
    if (!consulta) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.status(200).json(consulta);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const createConsulta = async (req, res) => {
  try {
    const { fecha, motivo, diagnostico, anamnesis, tratamiento, patologia, id_paciente, id_usuario } = req.body;
    const errors = [];

    if (!fecha) errors.push('fecha es requerida');
    if (!motivo) errors.push('motivo es requerido');
    if (!anamnesis) errors.push('anamnesis es requerida');
    if (!id_paciente) errors.push('id_paciente es requerido');
    if (id_paciente && isNaN(parseInt(id_paciente, 10))) errors.push('id_paciente debe ser un número válido');
    if (!id_usuario) errors.push('id_usuario es requerido');
    if (id_usuario && isNaN(parseInt(id_usuario, 10))) errors.push('id_usuario debe ser un número válido');

    if (errors.length) return res.status(400).json({ errors });

    const consultaData = {
      fecha,
      motivo,
      diagnostico,
      anamnesis,
      tratamiento,
      patologia,
      id_paciente,
      id_usuario
    };

    const newConsulta = await consultaService.createConsulta(consultaData);
    res.status(201).json(newConsulta);
  } catch (error) {
    console.error('Error en createConsulta controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear consulta'];
    res.status(status).json({ errors: errs });
  }
};

const updateConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, motivo, diagnostico, anamnesis, tratamiento, patologia, id_paciente, id_usuario } = req.body;
    const errors = [];

    if (id_paciente && isNaN(parseInt(id_paciente, 10))) errors.push('id_paciente debe ser un número válido');
    if (id_usuario && isNaN(parseInt(id_usuario, 10))) errors.push('id_usuario debe ser un número válido');

    if (errors.length) return res.status(400).json({ errors });

    const consultaData = {
      fecha,
      motivo,
      diagnostico,
      anamnesis,
      tratamiento,
      patologia,
      id_paciente,
      id_usuario
    };

    const updated = await consultaService.updateConsulta(id, consultaData);
    if (!updated) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error en updateConsulta controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al actualizar consulta'];
    res.status(status).json({ errors: errs });
  }
};

const deleteConsulta = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await consultaService.deleteConsulta(id);
    if (!deleted) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.status(200).json({ message: 'Consulta eliminada correctamente' });
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al eliminar consulta'];
    res.status(status).json({ errors: errs });
  }
};

const filterConsultas = async (req, res) => {
  try {
    const { limit, page } = req.params;
    const filterCriteria = req.body || {};

    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
    }

    const offset = (pageNum - 1) * limitNum;
    const { rows: consultas, count: total } = await consultaService.filterConsultasPaginated(filterCriteria, limitNum, offset);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({ data: consultas, pagination: { total, currentPage: pageNum, limit: limitNum, totalPages } });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

// Crear consulta con lista de fotos (transaccional)
const createConsultaWithPhotos = async (req, res) => {
  try {
    const { fecha, motivo, diagnostico, anamnesis, tratamiento, patologia, id_paciente, id_usuario, fotos } = req.body;
    const errors = [];

    if (!fecha) errors.push('fecha es requerida');
    if (!motivo) errors.push('motivo es requerido');
    if (!anamnesis) errors.push('anamnesis es requerida');
    if (!id_paciente) errors.push('id_paciente es requerido');
    if (id_paciente && isNaN(parseInt(id_paciente, 10))) errors.push('id_paciente debe ser un número válido');
    if (!id_usuario) errors.push('id_usuario es requerido');
    if (id_usuario && isNaN(parseInt(id_usuario, 10))) errors.push('id_usuario debe ser un número válido');
    if (!Array.isArray(fotos)) errors.push('fotos debe ser una lista');

    if (errors.length) return res.status(400).json({ errors });

    // Validar que cada foto tenga una imagen
    const fotoErrors = [];
    const validFotos = [];
    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];
      if (!foto.imagen) {
        fotoErrors.push(`Foto #${i + 1}: imagen es requerida (formato Base64)`);
      } else {
        validFotos.push(foto);
      }
    }

    if (fotoErrors.length) return res.status(400).json({ errors: fotoErrors });

    const consultaData = {
      fecha,
      motivo,
      diagnostico,
      anamnesis,
      tratamiento,
      patologia,
      id_paciente,
      id_usuario
    };

    const created = await consultaService.createConsultaWithPhotos(consultaData, validFotos);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error en createConsultaWithPhotos controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear consulta con fotos'];
    res.status(status).json({ errors: errs });
  }
};

module.exports = {
  getAllConsultas,
  getConsultaById,
  createConsulta,
  updateConsulta,
  deleteConsulta,
  filterConsultas,
  createConsultaWithPhotos
};
