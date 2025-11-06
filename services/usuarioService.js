// services/usuarioService.js

const  Usuario  = require("../models/usuario");
const Oferta = require("../models/oferta");
const Factura = require("../models/factura");
const Servicio = require("../models/servicio");
const Producto = require("../models/producto");
const Contrato = require("../models/contrato");
const TipoContrato = require("../models/tipo_contrato");
const { calcularSumaGeneral } = require("./facturaService");
const { Op } = require('sequelize');

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
          model: Oferta,
          required: false
        },
        {
          model: Factura,
          as: 'facturas',
          required: false,
          include: [
            { model: Servicio, as: 'servicio' },
            { model: Producto, as: 'productos', through: { attributes: ['cantidad', 'precioVenta', 'costoVenta'] } },
            { model: Contrato, as: 'contrato', include: [{ model: TipoContrato, as: 'tipoContrato' }] },
          ]
        }
      ]
    });
    return usuarios.map(mapUsuarioWithFacturaTotals);
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
        model: Oferta,
        required: false
      },
      {
        model: Factura,
        as: 'facturas',
        required: false,
        include: [
          { model: Servicio, as: 'servicio' },
          { model: Producto, as: 'productos', through: { attributes: ['cantidad', 'precioVenta', 'costoVenta'] } },
          { model: Contrato, as: 'contrato', include: [{ model: TipoContrato, as: 'tipoContrato' }] },
        ]
      }
    ]
  });
  return usuario ? mapUsuarioWithFacturaTotals(usuario) : null;
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
    return await Usuario.create(usuarioData);
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
      await usuario.update(userData);
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
    const usuario = await Usuario.findOne({
      where: { id_usuario: id }
    });
    
    if (usuario) {
      await usuario.destroy();
      return true;
    }
    return false;
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
 * Filtrar usuarios por múltiples criterios
 */
const filterUsuarios = async (filterCriteria) => {
  try {
    const whereClause = {};
    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        whereClause[key] = { [Op.iLike]: `%${filterCriteria[key].toLowerCase()}%` };
      }
    }

    const usuarios = await Usuario.findAll({
      where: whereClause,
      include: [
        {
          model: Oferta,
          required: false
        },
        {
          model: Factura,
          as: 'facturas',
          required: false,
          include: [
            { model: Servicio, as: 'servicio' },
            { model: Producto, as: 'productos', through: { attributes: ['cantidad', 'precioVenta', 'costoVenta'] } },
            { model: Contrato, as: 'contrato', include: [{ model: TipoContrato, as: 'tipoContrato' }] },
          ]
        }
      ]
    });
    return usuarios.map(mapUsuarioWithFacturaTotals);
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
  filterUsuarios,
  usuarioExistsByCarnet,
};