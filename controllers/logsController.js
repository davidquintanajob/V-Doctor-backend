const { filterLogsByCriteria } = require('../services/logsService');

const filterLogs = async (req, res) => {
  try {
    const {
      fecha_desde,
      fecha_hasta,
      metodo,
      nombre_usuario,
      urls
    } = req.body || {};

    if (!fecha_desde || !fecha_hasta) {
      return res.status(400).json({
        error: 'Los campos fecha_desde y fecha_hasta son obligatorios'
      });
    }

    const result = await filterLogsByCriteria({
      fecha_desde,
      fecha_hasta,
      metodo,
      nombre_usuario,
      urls
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en filterLogs controller:', error);
    const status = error.status || 500;
    const message =
      status === 400
        ? error.message || 'Parámetros de filtro inválidos'
        : 'Error interno al filtrar logs';

    return res.status(status).json({
      error: message,
      details: error.message
    });
  }
};

// ✅ Verifica que esto esté al final del archivo
module.exports = {
  filterLogs
};