const ventaService = require('../services/ventaService');
const { tiposMedicamento } = require('../models/medicamento');
const { Paciente } = require('../models/paciente');

// Valida que exedente_redondeo sea numérico y no negativo
const validateExedente = (value) => {
  if (value === undefined || value === null) return { valid: true };
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) return { valid: false, error: 'exedente_redondeo debe ser un número' };
  if (num < 0) return { valid: false, error: 'exedente_redondeo no puede ser negativo' };
  return { valid: true };
};

// Valida que descuento sea numérico entre 0 y 100 (si se proporciona)
const validateDescuento = (value) => {
  if (value === undefined || value === null) return { valid: true };
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) return { valid: false, error: 'descuento debe ser un número' };
  if (num < 0 || num > 100) return { valid: false, error: 'descuento debe estar entre 0 y 100' };
  return { valid: true };
};

const getAllVentas = async (req, res) => {
  try {
    const ventas = await ventaService.getAllVentas();
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const getVentaById = async (req, res) => {
  try {
    const venta = await ventaService.getVentaById(req.params.id);
    if (!venta) return res.status(404).json({ errors: ['Venta no encontrada'] });
    res.json(venta);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const validateVenta = async (req, res) => {
  try {
    // Validaciones locales de campos nuevos
    const descVal = validateDescuento(req.body.descuento);
    if (!descVal.valid) {
      return res.status(400).json({
        message: 'Hay errores que impiden la creación de la venta',
        valid: false,
        errors: [descVal.error]
      });
    }
    const exVal = validateExedente(req.body.exedente_redondeo);
    if (!exVal.valid) {
      return res.status(400).json({
        message: 'Hay errores que impiden la creación de la venta',
        valid: false,
        errors: [exVal.error]
      });
    }
    const validation = await ventaService.validateCreate(req.body);
    if (validation.valid) {
      return res.status(200).json({ 
        message: 'La venta puede ser creada sin problemas',
        valid: true
      });
    }
    res.status(400).json({ 
      message: 'Hay errores que impiden la creación de la venta',
      valid: false,
      errors: validation.errors 
    });
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const validateUpdate = async (req, res) => {
  try {
    // Validaciones locales de campos nuevos
    const descVal = validateDescuento(req.body.descuento);
    if (!descVal.valid) {
      return res.status(400).json({
        message: 'Hay errores que impiden la actualización de la venta',
        valid: false,
        errors: [descVal.error]
      });
    }
    const exVal = validateExedente(req.body.exedente_redondeo);
    if (!exVal.valid) {
      return res.status(400).json({
        message: 'Hay errores que impiden la actualización de la venta',
        valid: false,
        errors: [exVal.error]
      });
    }
    const validation = await ventaService.validateUpdate(req.params.id, req.body);
    if (validation.valid) {
      return res.status(200).json({
        message: 'La venta puede ser actualizada sin problemas',
        valid: true
      });
    }
    res.status(400).json({
      message: 'Hay errores que impiden la actualización de la venta',
      valid: false,
      errors: validation.errors
    });
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const createVenta = async (req, res) => {
  try {
    // Validaciones locales de campos nuevos
    const descVal = validateDescuento(req.body.descuento);
    if (!descVal.valid) return res.status(400).json({ errors: [descVal.error] });
    const exVal = validateExedente(req.body.exedente_redondeo);
    if (!exVal.valid) return res.status(400).json({ errors: [exVal.error] });

    // Validar primero (servicio)
    const validation = await ventaService.validateCreate(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Si es válido, crear
    const newVenta = await ventaService.createVenta(req.body);
    res.status(201).json(newVenta);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const updateVenta = async (req, res) => {
  try {
    // Validaciones locales de campos nuevos
    const descVal = validateDescuento(req.body.descuento);
    if (!descVal.valid) return res.status(400).json({ errors: [descVal.error] });
    const exVal = validateExedente(req.body.exedente_redondeo);
    if (!exVal.valid) return res.status(400).json({ errors: [exVal.error] });

    // Validar primero (servicio)
    const validation = await ventaService.validateUpdate(req.params.id, req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Si es válido, actualizar
    const updated = await ventaService.updateVenta(req.params.id, req.body);
    if (!updated) return res.status(404).json({ errors: ['Venta no encontrada'] });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const deleteVenta = async (req, res) => {
  try {
    // Validar primero
    const validation = await ventaService.validateDelete(req.params.id);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Si es válido, eliminar
    const ok = await ventaService.deleteVenta(req.params.id);
    if (!ok) return res.status(404).json({ errors: ['Venta no encontrada'] });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const filterVentas = async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const page = parseInt(req.params.page) || 1;
    const offset = (page - 1) * limit;
    
    const result = await ventaService.filterVentasPaginated(req.body, limit, offset);
    res.json({
      data: result.rows,
      pagination: {
        total: result.count,
        limit,
        page,
        pages: Math.ceil(result.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const updateVentaUsuarios = async (req, res) => {
  try {
    const { usuarios } = req.body;
    
    // Validar primero
    const validation = await ventaService.validateUpdateUsuarios(req.params.id, usuarios);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Si es válido, actualizar
    const venta = await ventaService.updateVentaUsuarios(req.params.id, usuarios);
    res.json(venta);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const getVentasMedicamentoPaciente = async (req, res) => {
  try {
    const pacienteId = req.params.paciente;
    const tipo = req.params.tipo_medicamento;

    // Validar tipo de medicamento usando los tipos definidos en el modelo
    if (!tiposMedicamento.includes(tipo)) {
      return res.status(400).json({ errors: [`Tipo de medicamento inválido. Opciones: ${tiposMedicamento.join(', ')}`] });
    }

    // Validar que el paciente exista
    const paciente = await Paciente.findByPk(pacienteId);
    if (!paciente) return res.status(404).json({ errors: ['Paciente no encontrado'] });

    // Obtener ventas que estén relacionadas a una consulta cuyo paciente sea el indicado
    // y cuyo comerciable sea un producto que tenga un medicamento con el tipo solicitado
    const ventas = await ventaService.getVentasByPacienteAndTipoMedicamento(pacienteId, tipo);
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const getVentasByComerciable = async (req, res) => {
  try {
    const id = req.params.id_comerciable;
    const ventas = await ventaService.getVentasByComerciable(id);
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

module.exports = {
  getAllVentas,
  getVentaById,
  validateVenta,
  validateUpdate,
  createVenta,
  updateVenta,
  deleteVenta,
  filterVentas,
  updateVentaUsuarios,
  getVentasMedicamentoPaciente,
  getVentasByComerciable,
};
