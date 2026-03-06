const { Tarea } = require('../models/tarea');
const { Usuario } = require('../models/usuario');
const { HistorialTarea } = require('../models/historial_tarea');
const sequelize = require('../helpers/database');
const { Op } = require('sequelize');
const { getIO } = require('../helpers/socket');

const getAllTareas = async () => {
  try {
    const tareas = await Tarea.findAll({
      include: [
        { model: Usuario, required: false },
        { model: HistorialTarea, required: false }
      ],
      order: [['fecha_creacion', 'DESC']]
    });
    return tareas;
  } catch (error) {
    console.error('Error en servicio getAllTareas:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener tareas');
      err.errors = [error.message || 'Error interno al obtener tareas'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getTareaById = async (id) => {
  try {
    const tarea = await Tarea.findOne({
      where: { id_tarea: id },
      include: [
        { model: Usuario, required: false },
        { model: HistorialTarea, required: false }
      ]
    });
    return tarea;
  } catch (error) {
    console.error('Error en servicio getTareaById:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener tarea');
      err.errors = [error.message || 'Error interno al obtener tarea'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const createTarea = async (tareaData) => {
  const t = await sequelize.transaction();
  try {
    // Asegurar que fecha_creacion se establezca si no viene
    const fechaActual = new Date();
    if (!tareaData.fecha_creacion) {
      tareaData.fecha_creacion = fechaActual;
    }
    
    // Crear la tarea en transacción
    const newTarea = await Tarea.create(tareaData, { transaction: t });

    // Obtener información del usuario si existe
    let usuarioNombre = null;
    if (tareaData.id_usuario) {
      const usuario = await Usuario.findOne({ 
        where: { id_usuario: tareaData.id_usuario },
        transaction: t
      });
      if (usuario) {
        usuarioNombre = usuario.nombre_natural;
      }
    }

    // Crear historial de creación
    const descripcionHistorial = usuarioNombre 
      ? `Tarea creada por ${usuarioNombre}`
      : 'Tarea creada';

    await HistorialTarea.create({
      descripcion: descripcionHistorial,
      fecha: fechaActual,
      id_tarea: newTarea.id_tarea
    }, { transaction: t });

    await t.commit();
    const created = await getTareaById(newTarea.id_tarea);

    // Notificar por WebSocket al usuario asignado (si está conectado)
    try {
      if (created && created.id_usuario) {
        const io = getIO();
        const room = `user:${created.id_usuario}`;
        io.to(room).emit('tarea:creada', {
          id_tarea: created.id_tarea,
          titulo: created.titulo,
          descripcion: created.descripcion,
          estado: created.estado,
          id_usuario: created.id_usuario,
          fecha_creacion: created.fecha_creacion,
        });
      }
    } catch (socketError) {
      console.error('Error al emitir evento tarea:creada por Socket.IO:', socketError.message);
    }

    return created;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio createTarea:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear tarea');
      err.errors = [error.message || 'Error interno al crear tarea'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const updateTarea = async (id, tareaData) => {
  const t = await sequelize.transaction();
  try {
    // Obtener la tarea actual con sus valores anteriores
    const tarea = await Tarea.findOne({ 
      where: { id_tarea: id },
      include: [{ model: Usuario, required: false }],
      transaction: t
    });
    
    if (!tarea) {
      await t.rollback();
      return null;
    }

    // Guardar valores anteriores
    const tituloAnterior = tarea.titulo;
    const descripcionAnterior = tarea.descripcion || '';
    const idUsuarioAnterior = tarea.id_usuario;
    const estadoAnterior = tarea.estado;

    // Actualizar la tarea
    await tarea.update(tareaData, { transaction: t });

    // Obtener valores nuevos después de la actualización
    await tarea.reload({ transaction: t });
    const tituloNuevo = tarea.titulo;
    const descripcionNueva = tarea.descripcion || '';
    const idUsuarioNuevo = tarea.id_usuario;
    const estadoNuevo = tarea.estado;

    const fechaActual = new Date();
    const historialesACrear = [];

    // Verificar si cambió el título
    if (tareaData.titulo !== undefined && tituloAnterior !== tituloNuevo) {
      historialesACrear.push({
        descripcion: `Se modificó el título de "${tituloAnterior}" a "${tituloNuevo}"`,
        fecha: fechaActual,
        id_tarea: id
      });
    }

    // Verificar si cambió el estado
    if (tareaData.estado !== undefined && estadoAnterior !== estadoNuevo) {
      historialesACrear.push({
        descripcion: `El estado de la tarea cambió de "${estadoAnterior}" a "${estadoNuevo}"`,
        fecha: fechaActual,
        id_tarea: id
      });
    }

    // Verificar si cambió la descripción
    if (tareaData.descripcion !== undefined && descripcionAnterior !== descripcionNueva) {
      historialesACrear.push({
        descripcion: `Se modificó la descripción de "${descripcionAnterior}" a "${descripcionNueva}"`,
        fecha: fechaActual,
        id_tarea: id
      });
    }

    // Verificar si cambió el usuario
    // Comparar considerando null y undefined como equivalentes
    const usuarioAnteriorNormalizado = idUsuarioAnterior === null || idUsuarioAnterior === undefined ? null : idUsuarioAnterior;
    const usuarioNuevoNormalizado = idUsuarioNuevo === null || idUsuarioNuevo === undefined ? null : idUsuarioNuevo;
    
    if (tareaData.id_usuario !== undefined && usuarioAnteriorNormalizado !== usuarioNuevoNormalizado) {
      // Si se asignó un nuevo usuario (no es null)
      if (idUsuarioNuevo) {
        const usuario = await Usuario.findOne({ 
          where: { id_usuario: idUsuarioNuevo },
          transaction: t
        });
        if (usuario) {
          historialesACrear.push({
            descripcion: `Se asignó el usuario ${usuario.nombre_natural} a la tarea`,
            fecha: fechaActual,
            id_tarea: id
          });
        }
      }
      // Si se desasignó el usuario (pasó de tener valor a null), no creamos historial según los requisitos
      // Solo se crea historial cuando se asigna un usuario
    }

    // Crear todos los historiales necesarios
    if (historialesACrear.length > 0) {
      await HistorialTarea.bulkCreate(historialesACrear, { transaction: t });
    }

    await t.commit();
    const updated = await getTareaById(id);

    // Notificar por WebSocket al usuario asignado (si está conectado)
    try {
      console.log('WS updateTarea - datos previos/nuevos de usuario', {
        id_tarea: id,
        usuarioAnteriorNormalizado,
        usuarioNuevoNormalizado,
        tareaData_id_usuario: tareaData.id_usuario,
        updated_id_usuario: updated && updated.id_usuario,
      });

      if (updated && updated.id_usuario) {
        const io = getIO();
        const room = `user:${updated.id_usuario}`;

        console.log('WS updateTarea - emitiendo tarea:actualizada', {
          room,
          payload: {
            id_tarea: updated.id_tarea,
            titulo: updated.titulo,
            descripcion: updated.descripcion,
            estado: updated.estado,
            id_usuario: updated.id_usuario,
            fecha_creacion: updated.fecha_creacion,
          },
        });

        io.to(room).emit('tarea:actualizada', {
          id_tarea: updated.id_tarea,
          titulo: updated.titulo,
          descripcion: updated.descripcion,
          estado: updated.estado,
          id_usuario: updated.id_usuario,
          fecha_creacion: updated.fecha_creacion,
        });
      } else {
        console.log('WS updateTarea - no se emite porque updated o updated.id_usuario es nulo', {
          updatedExiste: !!updated,
          updated_id_usuario: updated && updated.id_usuario,
        });
      }
    } catch (socketError) {
      console.error('Error al emitir evento tarea:actualizada por Socket.IO:', socketError.message);
    }

    return updated;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio updateTarea:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al actualizar tarea');
      err.errors = [error.message || 'Error interno al actualizar tarea'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const deleteTarea = async (id) => {
  const t = await sequelize.transaction();
  try {
    const tarea = await Tarea.findOne({
      where: { id_tarea: id },
      include: [
        { model: HistorialTarea, required: false }
      ],
      transaction: t
    });

    if (!tarea) {
      await t.rollback();
      return false;
    }

    // Eliminar historial de tareas primero
    await HistorialTarea.destroy({ where: { id_tarea: id }, transaction: t });

    // Luego eliminar la tarea
    await tarea.destroy({ transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    console.error('Error en servicio deleteTarea:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al eliminar tarea');
      err.errors = [error.message || 'Error interno al eliminar tarea'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const filterTareasPaginated = async (filterCriteria, limit, offset) => {
  try {
    const whereClause = {};
    const include = [
      { model: Usuario, required: false },
      { model: HistorialTarea, required: false }
    ];

    // Filtro por título
    if (filterCriteria && filterCriteria.titulo && filterCriteria.titulo.trim() !== '') {
      whereClause.titulo = { [Op.iLike]: `%${String(filterCriteria.titulo).trim()}%` };
      delete filterCriteria.titulo;
    }

    // Filtro por descripción
    if (filterCriteria && filterCriteria.descripcion && filterCriteria.descripcion.trim() !== '') {
      whereClause.descripcion = { [Op.iLike]: `%${String(filterCriteria.descripcion).trim()}%` };
      delete filterCriteria.descripcion;
    }

    // Filtro por rango de fecha de creación (incluyendo extremos)
    if (filterCriteria && filterCriteria.fecha_creacion_desde && filterCriteria.fecha_creacion_hasta) {
      // Parsear la fecha y crear fechas en UTC para evitar problemas de zona horaria
      const fechaDesdeStr = String(filterCriteria.fecha_creacion_desde).trim();
      const fechaHastaStr = String(filterCriteria.fecha_creacion_hasta).trim();
      
      // Crear fechas en UTC: inicio del día (00:00:00.000 UTC)
      const fechaDesde = new Date(fechaDesdeStr + 'T00:00:00.000Z');
      
      // Crear fecha en UTC: fin del día (23:59:59.999 UTC)
      const fechaHasta = new Date(fechaHastaStr + 'T23:59:59.999Z');
      
      // Usar Op.and con Op.gte y Op.lte para incluir los extremos
      whereClause.fecha_creacion = {
        [Op.gte]: fechaDesde,
        [Op.lte]: fechaHasta
      };
      delete filterCriteria.fecha_creacion_desde;
      delete filterCriteria.fecha_creacion_hasta;
    } else if (filterCriteria && filterCriteria.fecha_creacion_desde) {
      // Incluir desde el inicio del día en UTC
      const fechaDesdeStr = String(filterCriteria.fecha_creacion_desde).trim();
      const fechaDesde = new Date(fechaDesdeStr + 'T00:00:00.000Z');
      whereClause.fecha_creacion = { [Op.gte]: fechaDesde };
      delete filterCriteria.fecha_creacion_desde;
    } else if (filterCriteria && filterCriteria.fecha_creacion_hasta) {
      // Incluir hasta el fin del día en UTC
      const fechaHastaStr = String(filterCriteria.fecha_creacion_hasta).trim();
      const fechaHasta = new Date(fechaHastaStr + 'T23:59:59.999Z');
      whereClause.fecha_creacion = { [Op.lte]: fechaHasta };
      delete filterCriteria.fecha_creacion_hasta;
    }

    // Filtro por estado
    if (filterCriteria && filterCriteria.estado && filterCriteria.estado.trim() !== '') {
      whereClause.estado = { [Op.iLike]: `%${String(filterCriteria.estado).trim()}%` };
      delete filterCriteria.estado;
    }

    // Filtros adicionales para otros campos
    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        if (filterCriteria[key] === undefined || filterCriteria[key] === null || filterCriteria[key] === '') continue;
        
        const stringFields = ['estado'];
        if (stringFields.includes(key)) {
          whereClause[key] = { [Op.iLike]: `%${String(filterCriteria[key]).trim()}%` };
        }
      }
    }

    const result = await Tarea.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include,
      distinct: true,
      order: [['fecha_creacion', 'DESC']] // Ordenar por fecha de creación descendente (más reciente primero)
    });
    
    return result;
  } catch (error) {
    console.error('Error en servicio filterTareasPaginated:', error);
    
    if (error.name === 'SequelizeDatabaseError') {
      const err = new Error('Error de base de datos al filtrar tareas');
      err.status = 400;
      throw err;
    }
    
    const err = new Error(error.message || 'Error interno al filtrar tareas');
    err.status = error.status || 500;
    throw err;
  }
};

module.exports = {
  getAllTareas,
  getTareaById,
  createTarea,
  updateTarea,
  deleteTarea,
  filterTareasPaginated,
};

