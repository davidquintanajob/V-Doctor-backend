const salidaService = require('../services/salidaService');

const getSalidaById = async (req, res) => {
  try {
    const { id } = req.params;
    const salida = await salidaService.getSalidaById(id);
    if (!salida) {
      return res.status(404).json({ error: 'Salida no encontrada' });
    }
    res.status(200).json(salida);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const createSalida = async (req, res) => {
  const { id_comerciable, cantidad, cambio_moneda, nota, fecha } = req.body;
  const errors = [];

  if (!id_comerciable) errors.push("El producto es requerido");
  if (!cantidad) errors.push("La cantidad es requerida");
  if (!cambio_moneda) errors.push("El cambio de moneda es requerido");
  if (!nota) errors.push("La nota es requerida");
  if (!fecha) errors.push("La fecha es requerida");

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const newSalida = await salidaService.createSalida(req.body);
    res.status(201).json(newSalida);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const updateSalida = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_comerciable, cantidad, cambio_moneda, nota, fecha } = req.body;
    const errors = [];

    if (id_comerciable !== undefined && !id_comerciable) {
      errors.push("El producto es inválido");
    }
    if (cantidad !== undefined && !cantidad) {
      errors.push("La cantidad es inválida");
    }
    if (cambio_moneda !== undefined && !cambio_moneda) {
      errors.push("El cambio de moneda es inválido");
    }
    if (nota !== undefined && !nota) {
      errors.push("La nota es inválida");
    }
    if (fecha !== undefined && !fecha) {
      errors.push("La fecha es inválida");
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const salidaActualizada = await salidaService.updateSalida(id, req.body);
    if (!salidaActualizada) {
      return res.status(404).json({ error: 'Salida no encontrada' });
    }
    res.status(200).json(salidaActualizada);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const deleteSalida = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await salidaService.deleteSalida(id);
    if (!eliminado) {
      return res.status(404).json({ error: 'Salida no encontrada' });
    }
    res.status(200).json({ message: 'Salida eliminada correctamente' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const filterSalidas = async (req, res) => {
  try {
    const { limit, page } = req.params;
    const filterCriteria = req.body;

    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);

    if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
    }

    const offset = (pageNum - 1) * limitNum;

    const {
      rows: salidas,
      count: total,
      totalCantidad,
      totalCostoCup,
      totalCostoUsd
    } = await salidaService.filterSalidasPaginated(filterCriteria, limitNum, offset);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      data: salidas,
      pagination: {
        total,
        currentPage: pageNum,
        limit: limitNum,
        totalPages,
        totalCantidad: parseFloat(totalCantidad.toFixed(2)),
        totalCostoCup: parseFloat(totalCostoCup.toFixed(2)),
        totalCostoUsd: parseFloat(totalCostoUsd.toFixed(2))
      }
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const getAllSalidas = async (req, res) => {
  try {
    const salidas = await salidaService.getAllSalidas();
    res.status(200).json(salidas);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

module.exports = {
  getSalidaById,
  createSalida,
  updateSalida,
  deleteSalida,
  filterSalidas,
  getAllSalidas,
};