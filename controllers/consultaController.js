const consultaService = require('../services/consultaService');
const ventaService = require('../services/ventaService');
const { Venta } = require('../models/venta');

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
    // Eliminar todas las ventas relacionadas con esta consulta usando la lógica existente
    try {
      const ventasRelacionadas = await Venta.findAll({ where: { id_consulta: id } });
      console.log('updateConsulta: ventas relacionadas count for consulta', id, ':', ventasRelacionadas.length);
      for (const v of ventasRelacionadas) {
        try {
          console.log('updateConsulta: deleting venta id', v.id_venta);
          await ventaService.deleteVenta(v.id_venta);
          console.log('updateConsulta: deleted venta id', v.id_venta);
        } catch (delErr) {
          console.error('Error deleting venta during consulta update:', v.id_venta, delErr);
          const status = delErr.status || 500;
          const errs = delErr.errors && Array.isArray(delErr.errors) ? delErr.errors : [delErr.message || 'Error al eliminar venta relacionada'];
          return res.status(status).json({ errors: errs });
        }
      }
    } catch (fetchErr) {
      console.error('Error fetching ventas for consulta during update:', fetchErr);
      return res.status(500).json({ errors: [fetchErr.message || 'Error al obtener ventas relacionadas'] });
    }

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
    // Primero eliminar ventas relacionadas usando la lógica existente de ventaService
    try {
      const ventasRelacionadas = await Venta.findAll({ where: { id_consulta: id } });
      for (const v of ventasRelacionadas) {
        try {
          console.log('deleteConsulta: deleting related venta id', v.id_venta);
          await ventaService.deleteVenta(v.id_venta);
          console.log('deleteConsulta: deleted related venta id', v.id_venta);
        } catch (delErr) {
          console.error('Error deleting related venta id', v.id_venta, delErr);
          const status = delErr.status || 500;
          const errs = delErr.errors && Array.isArray(delErr.errors) ? delErr.errors : [delErr.message || 'Error al eliminar venta relacionada'];
          return res.status(status).json({ errors: errs });
        }
      }
    } catch (fetchErr) {
      console.error('Error fetching related ventas for consulta delete:', fetchErr);
      return res.status(500).json({ errors: [fetchErr.message || 'Error al obtener ventas relacionadas'] });
    }

    const deleted = await consultaService.deleteConsulta(id);
    if (!deleted) return res.status(404).json({ error: 'Consulta no encontrada' });
    res.status(200).json({ message: 'Consulta y ventas relacionadas eliminadas correctamente' });
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

    // Validaciones básicas
    if (!fecha) errors.push('fecha es requerida');
    if (!motivo) errors.push('motivo es requerido');
    if (!anamnesis) errors.push('anamnesis es requerida');
    if (!id_paciente) errors.push('id_paciente es requerido');
    if (id_paciente && isNaN(parseInt(id_paciente, 10))) errors.push('id_paciente debe ser un número válido');
    if (!id_usuario) errors.push('id_usuario es requerido');
    if (id_usuario && isNaN(parseInt(id_usuario, 10))) errors.push('id_usuario debe ser un número válido');
    if (!Array.isArray(fotos)) errors.push('fotos debe ser una lista');

    // Si hay errores de validación, devolver 400 inmediatamente
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false,
        errors 
      });
    }

    // Validar que cada foto tenga imagen
    const fotoErrors = [];
    const validFotos = [];
    
    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];
      
      if (!foto.imagen || typeof foto.imagen !== 'string') {
        fotoErrors.push(`Foto #${i + 1}: imagen es requerida (formato Base64)`);
      } else {
        // Validar formato base64 básico
        if (foto.imagen.trim().length < 100 && !foto.imagen.includes('base64')) {
          fotoErrors.push(`Foto #${i + 1}: la imagen no parece estar en formato Base64 válido`);
        } else {
          validFotos.push(foto);
        }
      }
    }

    if (fotoErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        errors: fotoErrors 
      });
    }

    // Preparar datos para el servicio
    const consultaData = {
      fecha,
      motivo,
      diagnostico: diagnostico || null,
      anamnesis,
      tratamiento: tratamiento || null,
      patologia: patologia || null,
      id_paciente: parseInt(id_paciente, 10),
      id_usuario: parseInt(id_usuario, 10)
    };

    // Llamar al servicio
    const created = await consultaService.createConsultaWithPhotos(consultaData, validFotos);
    
    // Éxito
    res.status(201).json({
      success: true,
      message: 'Consulta creada exitosamente con fotos',
      data: created
    });
    
  } catch (error) {
    console.error('Error en createConsultaWithPhotos controller:', error);
    
    // Determinar código de estado
    let statusCode = 500;
    let errorMessage = 'Error interno del servidor';
    let errorDetails = [];
    
    // Manejar errores específicos
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      statusCode = 400;
      errorMessage = 'Error de referencia: El paciente o usuario especificado no existe';
      errorDetails = [error.message || 'Clave foránea no válida'];
      
    } else if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      statusCode = 400;
      errorMessage = 'Error de validación';
      errorDetails = error.errors ? error.errors.map(e => e.message) : [error.message];
      
    } else if (error.status && error.status >= 400 && error.status < 500) {
      // Usar el estado del error si es 4xx
      statusCode = error.status;
      errorMessage = error.message || 'Error en la solicitud';
      errorDetails = error.errors || [error.message];
      
    } else {
      // Error interno (5xx)
      errorMessage = 'Error interno al procesar la solicitud';
      errorDetails = ['Por favor, intente nuevamente más tarde'];
      console.error('Error interno no manejado:', error);
    }

    // En desarrollo, incluir más detalles
    if (process.env.NODE_ENV === 'development') {
      errorDetails.push(`Tipo: ${error.name || 'Desconocido'}`);
      if (error.stack) {
        errorDetails.push(`Stack: ${error.stack.split('\n')[0]}`);
      }
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      errors: errorDetails
    });
  }
};

// Actualizar consulta y reemplazar fotos (transaccional en servicio)
const updateConsultaWithPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, motivo, diagnostico, anamnesis, tratamiento, patologia, id_paciente, id_usuario, fotos } = req.body;
    const errors = [];

    if (!id) errors.push('id es requerido en la ruta');
    if (id_paciente && isNaN(parseInt(id_paciente, 10))) errors.push('id_paciente debe ser un número válido');
    if (id_usuario && isNaN(parseInt(id_usuario, 10))) errors.push('id_usuario debe ser un número válido');

    // fotos es opcional para el update; si viene, debe ser arreglo
    if (fotos !== undefined && !Array.isArray(fotos)) errors.push('fotos debe ser una lista');

    if (Array.isArray(fotos)) {
      const fotoErrors = [];
      for (let i = 0; i < fotos.length; i++) {
        const foto = fotos[i];
        if (!foto || !foto.imagen || typeof foto.imagen !== 'string') {
          fotoErrors.push(`Foto #${i + 1}: imagen es requerida (formato Base64)`);
        } else {
          if (foto.imagen.trim().length < 100 && !foto.imagen.includes('base64')) {
            fotoErrors.push(`Foto #${i + 1}: la imagen no parece estar en formato Base64 válido`);
          }
        }
      }
      if (fotoErrors.length > 0) errors.push(...fotoErrors);
    }

    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    const consultaData = {
      fecha,
      motivo,
      diagnostico: diagnostico || null,
      anamnesis,
      tratamiento: tratamiento || null,
      patologia: patologia || null,
      id_paciente: id_paciente !== undefined ? (id_paciente !== null ? parseInt(id_paciente, 10) : null) : undefined,
      id_usuario: id_usuario !== undefined ? (id_usuario !== null ? parseInt(id_usuario, 10) : null) : undefined
    };

    const updated = await consultaService.updateConsultaWithPhotos(id, consultaData, Array.isArray(fotos) ? fotos : null);

    if (!updated) return res.status(404).json({ success: false, error: 'Consulta no encontrada' });

    res.status(200).json({ success: true, message: 'Consulta actualizada correctamente', data: updated });
  } catch (error) {
    console.error('Error en updateConsultaWithPhotos controller:', error);
    let statusCode = 500;
    let errorMessage = 'Error interno del servidor';
    let errorDetails = [];

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      statusCode = 400;
      errorMessage = 'Error de referencia: El paciente o usuario especificado no existe';
      errorDetails = [error.message || 'Clave foránea no válida'];
    } else if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      statusCode = 400;
      errorMessage = 'Error de validación';
      errorDetails = error.errors ? error.errors.map(e => e.message) : [error.message];
    } else if (error.status && error.status >= 400 && error.status < 500) {
      statusCode = error.status;
      errorMessage = error.message || 'Error en la solicitud';
      errorDetails = error.errors || [error.message];
    } else {
      errorMessage = 'Error interno al procesar la solicitud';
      errorDetails = ['Por favor, intente nuevamente más tarde'];
      console.error('Error interno no manejado:', error);
    }

    if (process.env.NODE_ENV === 'development') {
      errorDetails.push(`Tipo: ${error.name || 'Desconocido'}`);
      if (error.stack) errorDetails.push(`Stack: ${error.stack.split('\n')[0]}`);
    }

    res.status(statusCode).json({ success: false, message: errorMessage, errors: errorDetails });
  }
};

// Actualizar consulta, reemplazar fotos y opcionalmente reemplazar ventas relacionadas
const updateConsultaWithPhotosAndVentas = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, motivo, diagnostico, anamnesis, tratamiento, patologia, id_paciente, id_usuario, fotos, ventas } = req.body;

    // Validaciones básicas similares a updateConsultaWithPhotos
    const errors = [];
    if (!id) errors.push('id es requerido en la ruta');
    if (id_paciente && isNaN(parseInt(id_paciente, 10))) errors.push('id_paciente debe ser un número válido');
    if (id_usuario && isNaN(parseInt(id_usuario, 10))) errors.push('id_usuario debe ser un número válido');
    if (fotos !== undefined && !Array.isArray(fotos)) errors.push('fotos debe ser una lista');
    if (ventas !== undefined && !Array.isArray(ventas)) errors.push('ventas debe ser una lista');

    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    const consultaData = {
      fecha,
      motivo,
      diagnostico: diagnostico || null,
      anamnesis,
      tratamiento: tratamiento || null,
      patologia: patologia || null,
      id_paciente: id_paciente !== undefined ? (id_paciente !== null ? parseInt(id_paciente, 10) : null) : undefined,
      id_usuario: id_usuario !== undefined ? (id_usuario !== null ? parseInt(id_usuario, 10) : undefined) : undefined
    };

    // Actualizar consulta y fotos usando el servicio (maneja transacción interna)
    const updated = await consultaService.updateConsultaWithPhotos(id, consultaData, Array.isArray(fotos) ? fotos : null);
    if (!updated) return res.status(404).json({ success: false, error: 'Consulta no encontrada' });

    // Manejo de ventas:
    // - si `ventas` es undefined => no tocar ventas existentes
    // - si `ventas` es array vacío => eliminar todas las ventas relacionadas
    if (ventas === undefined) {
      return res.status(200).json({ success: true, message: 'Consulta actualizada correctamente', data: updated });
    }

    if (Array.isArray(ventas) && ventas.length === 0) {
      // eliminar todas las ventas relacionadas con esta consulta
      try {
        const ventasRelacionadas = await Venta.findAll({ where: { id_consulta: id } });
        for (const v of ventasRelacionadas) {
          try {
            await ventaService.deleteVenta(v.id_venta);
          } catch (delErr) {
            const status = delErr.status || 500;
            const errs = delErr.errors && Array.isArray(delErr.errors) ? delErr.errors : [delErr.message || 'Error al eliminar venta relacionada'];
            return res.status(status).json({ success: false, errors: errs });
          }
        }
      } catch (fetchErr) {
        return res.status(500).json({ success: false, errors: [fetchErr.message || 'Error al obtener ventas relacionadas'] });
      }
      return res.status(200).json({ success: true, message: 'Consulta actualizada y ventas relacionadas eliminadas', consulta: updated, ventas: [] });
    }


    // Reconciliar ventas: actualizar las que tienen id_venta existente, crear las nuevas y eliminar las que no aparecen
    console.log('updateConsultaWithPhotosAndVentas called for consulta id:', id);
    console.log('Incoming body keys:', Object.keys(req.body));
    console.log('Ventas provided:', Array.isArray(ventas) ? ventas.length : 0);

    const existingVentas = await Venta.findAll({ where: { id_consulta: id } });
    console.log('Existing ventas count for consulta', id, ':', existingVentas.length);
    const existingMap = new Map(existingVentas.map(v => [String(v.id_venta), v]));
    const resultadosVentas = [];
    const incomingIds = new Set();

    for (const ventaItem of ventas) {
      console.log('Processing incoming venta item:', ventaItem && ventaItem.id_venta ? ventaItem.id_venta : '<new>', 'summary keys:', Object.keys(ventaItem || {}));
      // Forzar que la venta apunte a esta consulta
      ventaItem.id_consulta = parseInt(id, 10);

      if (ventaItem.id_venta) {
        incomingIds.add(String(ventaItem.id_venta));

        // Seguridad: comprobar que la venta existe y pertenece a esta consulta antes de actualizar
        const ventaExistente = await Venta.findByPk(ventaItem.id_venta);
        console.log('Found ventaExistente:', ventaExistente ? ventaExistente.id_venta : null, 'belongs to consulta:', ventaExistente ? ventaExistente.id_consulta : null);
        if (ventaExistente && String(ventaExistente.id_consulta) === String(id)) {
          const validation = await ventaService.validateUpdate(ventaItem.id_venta, ventaItem);
          console.log('validateUpdate result for', ventaItem.id_venta, ':', validation && validation.valid ? 'valid' : validation.errors);
          if (!validation.valid) {
            console.log('Validation failed for update of venta', ventaItem.id_venta, validation.errors);
            return res.status(400).json({ success: false, errors: validation.errors });
          }
          const updatedV = await ventaService.updateVenta(ventaItem.id_venta, ventaItem);
          console.log('Updated venta:', updatedV && updatedV.id_venta);
          resultadosVentas.push(updatedV);
        } else {
          // Si no existe o no pertenece a esta consulta, crear nueva venta (ignorar id_venta entrante)
          const toCreate = { ...ventaItem };
          delete toCreate.id_venta;
          console.log('Creating new venta because id_venta not found or not belonging to consulta. toCreate keys:', Object.keys(toCreate));
          const validation = await ventaService.validateCreate(toCreate);
          console.log('validateCreate result:', validation && validation.valid ? 'valid' : validation.errors);
          if (!validation.valid) {
            console.log('Validation failed for create venta', validation.errors);
            return res.status(400).json({ success: false, errors: validation.errors });
          }
          const createdV = await ventaService.createVenta(toCreate);
          console.log('Created venta id:', createdV && createdV.id_venta);
          resultadosVentas.push(createdV);
        }
      } else {
        // Crear nueva
        console.log('Creating new venta (no id_venta provided) keys:', Object.keys(ventaItem || {}));
        const validation = await ventaService.validateCreate(ventaItem);
        console.log('validateCreate result:', validation && validation.valid ? 'valid' : validation.errors);
        if (!validation.valid) {
          console.log('Validation failed for create venta', validation.errors);
          return res.status(400).json({ success: false, errors: validation.errors });
        }
        const createdV = await ventaService.createVenta(ventaItem);
        console.log('Created venta id:', createdV && createdV.id_venta);
        resultadosVentas.push(createdV);
      }
    }

    // Eliminar las ventas existentes que no aparecieron en la lista entrante
    for (const v of existingVentas) {
      if (!incomingIds.has(String(v.id_venta))) {
        try {
          console.log('Deleting existing venta id (not in incoming list):', v.id_venta);
          await ventaService.deleteVenta(v.id_venta);
          console.log('Deleted venta id:', v.id_venta);
        } catch (err) {
          console.log('Error deleting venta id:', v.id_venta, err && err.message);
          const status = err.status || 500;
          const errs = err.errors && Array.isArray(err.errors) ? err.errors : [err.message || 'Error al eliminar venta relacionada'];
          return res.status(status).json({ success: false, errors: errs });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Consulta y ventas actualizadas correctamente', consulta: updated, ventas: resultadosVentas });

  } catch (error) {
    console.error('Error en updateConsultaWithPhotosAndVentas controller:', error);
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al actualizar consulta con ventas'];
    res.status(status).json({ success: false, errors: errs });
  }
};

module.exports = {
  getAllConsultas,
  getConsultaById,
  createConsulta,
  updateConsulta,
  deleteConsulta,
  filterConsultas,
  createConsultaWithPhotos,
  updateConsultaWithPhotos,
  updateConsultaWithPhotosAndVentas
};
