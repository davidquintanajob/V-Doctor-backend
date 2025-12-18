// services/usuarioService.js

const { Usuario } = require("../models/usuario");
const { Venta } = require("../models/venta");
const { Entrada } = require("../models/entrada");
const { Tarea } = require("../models/tarea");
const { Calendario } = require("../models/calendario");
const { VentaUsuario } = require("../models/venta_usuario");
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

// Helper: agrega totalFactura (servicios + productos + cargoAdicional)
const mapUsuarioWithFacturaTotals = (usuarioInstance) => {
  const u = usuarioInstance.toJSON ? usuarioInstance.toJSON() : usuarioInstance;
  if (!Array.isArray(u.facturas)) return u;
  u.facturas = u.facturas.map((f) => {
    const sums = calcularSumaGeneral(f);
    const cargoAdicional = f.cargoAdicional !== null && f.cargoAdicional !== undefined ? parseFloat(f.cargoAdicional) : 0;
    const totalFactura = Math.round(((sums.suma_general || 0) + cargoAdicional) * 100) / 100;
    return { ...f, totalFactura };
  });
  return u;
};

/**
 * Obtener todos los usuarios
 */
const getAllUsuarios = async () => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        {
          model: Venta,
          required: false,
          through: { attributes: [] } // Excluir atributos de la tabla intermedia
        },
        {
          model: Entrada,
          required: false
        },
        {
          model: Tarea,
          required: false
        },
        {
          model: Calendario,
          required: false
        }
      ]
    });
    return usuarios;
  } catch (error) {
    console.log("Error en los servicios de getAllUsuarios: ", error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener usuarios');
      err.errors = [error.message || 'Error interno al obtener usuarios'];
      err.status = error.status || 500;
      throw err;
    }
    throw error; // already structured
  }
};

/**
 * Obtener un usuario por ID
 */
const getUsuarioById = async (id) => {
  const usuario = await Usuario.findOne({
    where: { id_usuario: id },
    include: [
      {
        model: Venta,
        required: false,
        through: { attributes: [] }
      },
      {
        model: Entrada,
        required: false
      },
      {
        model: Tarea,
        required: false
      },
      {
        model: Calendario,
        required: false
      }
    ]
  });
  return usuario;
};

const usuarioExists = async (nombre_usuario) => {
  const usuario = await Usuario.findOne({ where: { nombre_usuario } });
  return usuario !== null; // Devuelve true si el usuario existe, false si no
};

const usuarioExistsByCarnet = async (carnet_identidad) => {
  if (!carnet_identidad) return false;
  const usuario = await Usuario.findOne({ where: { carnet_identidad } });
  return usuario !== null;
};

/**
 * Crear un nuevo usuario
 */
const createUsuario = async (usuarioData) => {
  try {
    // Extraer imagen (base64) si viene en la petición y evitar que se guarde como campo directo
    const imagenBase64 = usuarioData.imagen;
    if (imagenBase64) delete usuarioData.imagen;

    const newUsuario = await Usuario.create(usuarioData);

    // Si se envió imagen, guardarla en disco y actualizar `foto_firma`
    if (imagenBase64) {
      const FOTOS_CARPETA_USUARIOFIRMA = process.env.FOTOS_CARPETA_USUARIOFIRMA || '/fotos/usuariofirma';
      const imagePath = path.join(FOTOS_CARPETA_USUARIOFIRMA, `${newUsuario.id_usuario}.jpg`);
      await fs.writeFile(path.join(__dirname, '..', imagePath), imagenBase64, 'base64');
      await newUsuario.update({ foto_firma: imagePath });
    }

    return newUsuario;
  } catch (error) {
    console.log("Error al en el servicio de crear usuario: ", error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear usuario');
      err.errors = [error.message || 'Error interno al crear usuario'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

/**
 * Actualizar un usuario
 */
const updateUsuario = async (id, userData) => {
  try {
    const usuario = await Usuario.findOne({ where: { id_usuario: id } });
    if (usuario) {
      // Manejar imagen (base64) si viene
      const imagenBase64 = userData.imagen;
      if (imagenBase64) delete userData.imagen;

      await usuario.update(userData);

      if (imagenBase64) {
        const FOTOS_CARPETA_USUARIOFIRMA = process.env.FOTOS_CARPETA_USUARIOFIRMA || '/fotos/usuariofirma';
        const imagePath = path.join(FOTOS_CARPETA_USUARIOFIRMA, `${usuario.id_usuario}.jpg`);
        await fs.writeFile(path.join(__dirname, '..', imagePath), imagenBase64, 'base64');
        await usuario.update({ foto_firma: imagePath });
      }

      return usuario;
    }
    return null;
  } catch (error) {
    console.log("Error en el servicio de actualizar usuario: ", error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al actualizar usuario');
      err.errors = [error.message || 'Error interno al actualizar usuario'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

/**
 * Eliminar un usuario
 */
const deleteUsuario = async (id) => {
  try {
    const usuario = await Usuario.findOne({ where: { id_usuario: id } });

    if (!usuario) {
      return false; // Usuario no encontrado
    }

    // Contar asociaciones por separado para evitar usar `include.limit`
    const [entradasCount, ventasCount, tareasCount, calendariosCount] = await Promise.all([
      Entrada.count({ where: { id_usuario: id } }),
      VentaUsuario.count({ where: { id_usuario: id } }),
      Tarea.count({ where: { id_usuario: id } }),
      Calendario.count({ where: { id_usuario: id } })
    ]);

    const associations = [];
    if (entradasCount && entradasCount > 0) associations.push('entradas');
    if (ventasCount && ventasCount > 0) associations.push('ventas');
    if (tareasCount && tareasCount > 0) associations.push('tareas');
    if (calendariosCount && calendariosCount > 0) associations.push('calendarios');

    if (associations.length > 0) {
      const error = new Error(`No se puede eliminar el usuario porque está asociado con ${associations.join(', ')}.`);
      error.status = 400;
      throw error;
    }

    // Si tiene foto_firma en disco, intentar eliminarla
    if (usuario.foto_firma) {
      try {
        const fullPath = path.join(__dirname, '..', usuario.foto_firma);
        await fs.access(fullPath);
        await fs.unlink(fullPath);
        console.log(`✅ Foto firma eliminada: ${usuario.foto_firma}`);
      } catch (fileError) {
        console.warn(`⚠️ No se pudo eliminar la foto firma: ${usuario.foto_firma}`, fileError.message);
        // continuar con la eliminación del usuario aunque falle la eliminación del archivo
      }
    }

    await usuario.destroy();
    return true;
  } catch (error) {
    console.error("Error en el servicio de eliminar usuario:", error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al eliminar usuario');
      err.errors = [error.message || 'Error interno al eliminar usuario'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getUsuarioByNombreUsuario = async (nombre_usuario) => {
  try {
      return await Usuario.findOne({ where: { nombre_usuario } });
  } catch (error) {
      console.log("Error al obtener el usuario por nombre de usuario:", error);
      if (!error.errors || !Array.isArray(error.errors)) {
        const err = new Error(error.message || 'Error interno al obtener usuario');
        err.errors = [error.message || 'Error interno al obtener usuario'];
        err.status = error.status || 500;
        throw err;
      }
      throw error;
  }
};

/**
 * Filtrar usuarios por múltiples criterios con paginación
 */
const filterUsuariosPaginated = async (filterCriteria, limit, offset) => {
  try {
    const whereClause = {};
    if (!filterCriteria || typeof filterCriteria !== 'object') filterCriteria = {};
    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        const val = filterCriteria[key];
        if (val === null || val === undefined || val === '') continue;
        if (typeof val === 'boolean' || typeof val === 'number') {
          // For booleans and numbers, use exact match
          whereClause[key] = val;
        } else {
          // For other types, perform a case-insensitive partial match
          const strVal = String(val).toLowerCase().trim();
          whereClause[key] = { [Op.iLike]: `%${strVal}%` };
        }
      }
    }

    const result = await Usuario.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include: [
        {
          model: Venta,
          required: false,
          through: { attributes: [] }
        },
        {
          model: Entrada,
          required: false
        },
        {
          model: Tarea,
          required: false
        },
        {
          model: Calendario,
          required: false
        }
      ]
    });
    return result;
  } catch (error) {
    console.error("Error en el servicio de filtrar usuarios:", error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al filtrar usuarios');
      err.errors = [error.message || 'Error interno al filtrar usuarios'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

// Exportar las funciones
module.exports = {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  usuarioExists,
  getUsuarioByNombreUsuario,
  filterUsuariosPaginated,
  usuarioExistsByCarnet,
};
