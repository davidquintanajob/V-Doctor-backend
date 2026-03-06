const { Salida } = require("../models/salida");
const { Producto } = require("../models/producto");
const sequelize = require("../helpers/database");
const { Op } = require('sequelize');

const getSalidaById = async (id, transaction) => {
  const salida = await Salida.findOne({
    where: { id_salida: id },
    include: [
      {
        model: Producto,
        required: true,
        as: "producto"
      }
    ],
    transaction
  });
  return salida;
};

const createSalida = async (salidaData) => {
  const t = await sequelize.transaction();
  try {
    const { id_comerciable, cantidad, cambio_moneda, nota, fecha } = salidaData;

    const producto = await Producto.findOne({ where: { id_comerciable } });
    if (!producto) {
      throw new Error(`El producto proporcionado no existe.`);
    }

    if (producto.cantidad < cantidad) {
      throw new Error(`No hay suficiente cantidad en el producto para crear la salida.`);
    }

    const newSalida = await Salida.create({
      id_comerciable,
      cantidad,
      cambio_moneda,
      nota,
      fecha,
      costo_producto_cup: producto.costo_cup,
      costo_producto_usd: producto.costo_usd
    }, { transaction: t });

    await producto.update({
      cantidad: producto.cantidad - cantidad
    }, { transaction: t });

    await t.commit();
    return await getSalidaById(newSalida.id_salida);
  } catch (error) {
    await t.rollback();
    console.log("Error en el servicio de crear salida: ", error);
    const err = new Error(error.message || 'Error interno al crear la salida');
    err.errors = [error.message || 'Error interno al crear la salida'];
    err.status = error.status || 500;
    throw err;
  }
};

const updateSalida = async (id, salidaData) => {
  const t = await sequelize.transaction();
  try {
    const salida = await Salida.findOne({ where: { id_salida: id }, transaction: t });
    if (!salida) {
      await t.rollback();
      const error = new Error(`Salida con ID ${id} no encontrado`);
      error.status = 404;
      throw error;
    }

    const productoAnterior = await Producto.findOne({ where: { id_comerciable: salida.id_comerciable } });
    if (!productoAnterior) {
      throw new Error(`El producto asociado con ID ${salida.id_comerciable} no existe.`);
    }

    const { id_comerciable, cantidad, cambio_moneda, nota, fecha } = salidaData;

    if (id_comerciable !== salida.id_comerciable) {
      const productoNuevo = await Producto.findOne({ where: { id_comerciable } });
      if (!productoNuevo) {
        throw new Error(`El nuevo producto proporcionado no existe.`);
      }

      if (productoNuevo.cantidad < cantidad) {
        throw new Error(`No hay suficiente cantidad en el nuevo producto para actualizar la salida.`);
      }

      await productoAnterior.update({
        cantidad: productoAnterior.cantidad + salida.cantidad
      }, { transaction: t });

      await productoNuevo.update({
        cantidad: productoNuevo.cantidad - cantidad
      }, { transaction: t });
    } else {
      if (cantidad < 0) {
        throw new Error(`La cantidad no puede ser negativa.`);
      }

      if (productoAnterior.cantidad < cantidad) {
        throw new Error(`No hay suficiente cantidad en el producto para actualizar la salida.`);
      }

      await productoAnterior.update({
        cantidad: productoAnterior.cantidad - (cantidad - salida.cantidad)
      }, { transaction: t });
    }

    await salida.update({
      id_comerciable,
      cantidad,
      cambio_moneda,
      nota,
      fecha,
      costo_producto_cup: productoAnterior.costo_cup,
      costo_producto_usd: productoAnterior.costo_usd
    }, { transaction: t });

    await t.commit();
    return await getSalidaById(id);
  } catch (error) {
    await t.rollback();
    console.log("Error en el servicio de actualizar salida: ", error);
    const err = new Error(error.message || 'Error interno al actualizar la salida');
    err.errors = [error.message || 'Error interno al actualizar la salida'];
    err.status = error.status || 500;
    throw err;
  }
};

const deleteSalida = async (id) => {
  const t = await sequelize.transaction();
  try {
    const salida = await Salida.findOne({ where: { id_salida: id }, transaction: t });
    if (!salida) {
      await t.rollback();
      return false;
    }

    const producto = await Producto.findOne({ where: { id_comerciable: salida.id_comerciable } });
    if (!producto) {
      throw new Error(`El producto asociado con ID ${salida.id_comerciable} no existe.`);
    }

    await producto.update({
      cantidad: producto.cantidad + salida.cantidad
    }, { transaction: t });

    await salida.destroy({ transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    console.error("Error en el servicio de eliminar salida:", error);
    const err = new Error(error.message || 'Error interno al eliminar la salida');
    err.errors = [error.message || 'Error interno al eliminar la salida'];
    err.status = error.status || 500;
    throw err;
  }
};

const filterSalidasPaginated = async (filterCriteria, limit, offset) => {
  try {
    const whereClauseSalida = {};
    const whereClauseProducto = {};

    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        switch (key) {
          case 'fecha_desde':
            whereClauseSalida.fecha = { ...whereClauseSalida.fecha, [Op.gte]: filterCriteria[key] };
            break;
          case 'fecha_hasta':
            whereClauseSalida.fecha = { ...whereClauseSalida.fecha, [Op.lte]: filterCriteria[key] };
            break;
          case 'cantidad_min':
            whereClauseSalida.cantidad = { ...whereClauseSalida.cantidad, [Op.gte]: filterCriteria[key] };
            break;
          case 'cantidad_max':
            whereClauseSalida.cantidad = { ...whereClauseSalida.cantidad, [Op.lte]: filterCriteria[key] };
            break;
          case 'cambio_moneda_min':
            whereClauseSalida.cambio_moneda = { ...whereClauseSalida.cambio_moneda, [Op.gte]: filterCriteria[key] };
            break;
          case 'cambio_moneda_max':
            whereClauseSalida.cambio_moneda = { ...whereClauseSalida.cambio_moneda, [Op.lte]: filterCriteria[key] };
            break;
          case 'nota':
            whereClauseSalida.nota = { [Op.iLike]: `%${filterCriteria[key]}%` };
            break;
          case 'id_comerciable':
            whereClauseSalida.id_comerciable = filterCriteria[key];
            break;
        }
      }
    }

    const includeOptions = [
      {
        model: Producto,
        as: 'producto',
        where: whereClauseProducto,
        required: true
      }
    ];

    const { count, rows } = await Salida.findAndCountAll({
      where: whereClauseSalida,
      limit,
      offset,
      include: includeOptions,
      order: [['fecha', 'DESC']]
    });

    let totalCantidad = 0;
    let totalCostoCup = 0;
    let totalCostoUsd = 0;

    if (rows.length > 0) {
      const sumResult = await Salida.findAll({
        where: {
          id_salida: {
            [Op.in]: rows.map(salida => salida.id_salida)
          }
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_cantidad'],
          [sequelize.fn('SUM', sequelize.col('costo_producto_cup')), 'total_costo_cup'],
          [sequelize.fn('SUM', sequelize.col('costo_producto_usd')), 'total_costo_usd']
        ],
        raw: true
      });

      totalCantidad = parseFloat(sumResult[0]?.total_cantidad || 0);
      totalCostoCup = parseFloat(sumResult[0]?.total_costo_cup || 0);
      totalCostoUsd = parseFloat(sumResult[0]?.total_costo_usd || 0);
    }

    return {
      count,
      rows,
      totalCantidad,
      totalCostoCup,
      totalCostoUsd
    };
  } catch (error) {
    console.error("Error en el servicio de filtrar salidas:", error);
    const err = new Error(error.message || 'Error interno al filtrar salidas');
    err.errors = [error.message || 'Error interno al filtrar salidas'];
    err.status = error.status || 500;
    throw err;
  }
};

const getAllSalidas = async () => {
  try {
    const salidas = await Salida.findAll({
      include: [
        {
          model: Producto,
          required: true,
          as: "producto"
        }
      ],
      order: [['fecha', 'DESC']]
    });
    return salidas;
  } catch (error) {
    console.error("Error en el servicio de obtener todas las salidas:", error);
    const err = new Error(error.message || 'Error interno al obtener las salidas');
    err.errors = [error.message || 'Error interno al obtener las salidas'];
    err.status = error.status || 500;
    throw err;
  }
};

module.exports = {
  getSalidaById,
  createSalida,
  updateSalida,
  deleteSalida,
  filterSalidasPaginated,
  getAllSalidas
};