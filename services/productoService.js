const { Producto } = require("../models/producto");
const { Comerciable } = require("../models/comerciable");
const { Venta } = require("../models/venta");
const { Entrada } = require("../models/entrada");
const { Medicamento } = require("../models/medicamento");
const sequelize = require("../helpers/database");
const { Op } = require('sequelize');

const productoExistsByCodigo = async (codigo) => {
  const producto = await Producto.findOne({ where: { codigo } });
  return producto !== null;
};

const getAllProductos = async () => {
  try {
    const result = await Producto.findAll({
      include: [
        {
          model: Comerciable,
          required: true,
          include: [
            {
              model: Venta,
              required: false,
              as: "venta",
            }
          ]
        },
        {
          model: Medicamento,
          required: false,
        },
        {
          model: Entrada,
          required: false,
          as: "entradas"
        }
      ]
    });
    
    productos = result.filter(producto => !producto.medicamento);

    return productos;
  } catch (error) {
    console.log("Error en los servicios de getAllProductos: ", error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener productos');
      err.errors = [error.message || 'Error interno al obtener productos'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getProductoById = async (id, transaction) => {
  const producto = await Producto.findOne({
    where: { id_comerciable: id },
    include: [
      {
        model: Comerciable,
        required: true,
        include: [
          {
            model: Venta,
            required: false,
            as: "venta",
          }
        ]
      },
      {
        model: Entrada,
        required: false,
        as: "entradas"
      }
    ],
    transaction
  });
  return producto;
};

const createProducto = async (productoData, transaction) => {
  const t = transaction || await sequelize.transaction();
  try {
    if (await productoExistsByCodigo(productoData.codigo)) {
      throw new Error(`Ya existe un producto con el código: ${productoData.codigo}`);
    }

    const comerciableData = {
      precio_usd: productoData.precio_usd,
      precio_cup: productoData.precio_cup,
      roles_autorizados: productoData.roles_autorizados,
    };

    const comerciable = await Comerciable.create(comerciableData, { transaction: t });

    const newProductoData = { ...productoData };
    newProductoData.id_comerciable = comerciable.id_comerciable;
    
    const producto = await Producto.create(newProductoData, { transaction: t });

    if (!transaction) {
      await t.commit();
      return await getProductoById(producto.id_comerciable);
    }

    return await getProductoById(producto.id_comerciable, t);

  } catch (error) {
    if (!transaction) {
      await t.rollback();
    }
    console.log("Error al en el servicio de crear producto: ", error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear producto');
      err.errors = [error.message || 'Error interno al crear producto'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const updateProducto = async (id, productoData, transaction) => {
  const t = transaction || await sequelize.transaction();
  try {
    const producto = await Producto.findOne({ where: { id_comerciable: id }, transaction: t });
    if (!producto) {
      if (!transaction) {
        await t.rollback();
      }
      const error = new Error(`Producto con ID ${id} no encontrado`);
      error.status = 404;
      throw error;
    }

    if (productoData.codigo && productoData.codigo !== producto.codigo) {
      if (await productoExistsByCodigo(productoData.codigo)) {
        throw new Error(`Ya existe un producto con el código: ${productoData.codigo}`);
      }
    }

    await producto.update(productoData, { transaction: t });

    if (productoData.precio_usd || productoData.precio_cup || productoData.roles_autorizados) {
      const comerciable = await Comerciable.findOne({ where: { id_comerciable: id }, transaction: t });
      if (comerciable) {
        await comerciable.update(productoData, { transaction: t });
      }
    }

    if (!transaction) {
      await t.commit();
    }
    return await getProductoById(id);
  } catch (error) {
    if (!transaction) {
      await t.rollback();
    }
    console.log("Error en el servicio de actualizar producto: ", error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al actualizar producto');
      err.errors = [error.message || 'Error interno al actualizar producto'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const deleteProducto = async (id, transaction) => {
  const t = transaction || await sequelize.transaction();
  try {
    const venta = await Venta.findOne({ where: { id_comerciable: id }, transaction: t });
    if (venta) {
      throw new Error("No se puede eliminar el producto porque esté ya se ha vendido.");
    }

    const entrada = await Entrada.findOne({ where: { id_comerciable: id }, transaction: t });
    if (entrada) {
      throw new Error("No se puede eliminar el producto porque ya se ha registrado entradas.");
    }

    const producto = await Producto.findOne({ where: { id_comerciable: id }, transaction: t });
    if (!producto) {
      if (!transaction) {
        await t.rollback();
      }
      return false;
    }

    await producto.destroy({ transaction: t });

    const comerciable = await Comerciable.findOne({ where: { id_comerciable: id }, transaction: t });
    if (comerciable) {
      await comerciable.destroy({ transaction: t });
    }

    if (!transaction) {
      await t.commit();
    }
    return true;
  } catch (error) {
    if (!transaction) {
      await t.rollback();
    }
    console.error("Error en el servicio de eliminar producto:", error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al eliminar producto');
      err.errors = [error.message || 'Error interno al eliminar producto'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const filterProductosPaginated = async (filterCriteria, limit, offset) => {
  try {
    const whereClauseProducto = {};
    const whereClauseComerciable = {};

    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        switch (key) {
          case 'nombre':
            whereClauseProducto.nombre = { [Op.iLike]: `%${filterCriteria[key]}%` };
            break;
          case 'categoria':
            whereClauseProducto.categoria = { [Op.iLike]: `%${filterCriteria[key]}%` };
            break;
          case 'codigo':
            // Ignorar si está vacío o no contiene solo números
            if (filterCriteria[key] && /^\d+$/.test(filterCriteria[key])) {
              whereClauseProducto.codigo = { [Op.eq]: filterCriteria[key] };
            }
            break;
          case 'costo_usd_min':
            whereClauseProducto.costo_usd = { ...whereClauseProducto.costo_usd, [Op.gte]: filterCriteria[key] };
            break;
          case 'costo_usd_max':
            whereClauseProducto.costo_usd = { ...whereClauseProducto.costo_usd, [Op.lte]: filterCriteria[key] };
            break;
          case 'costo_cup_min':
            whereClauseProducto.costo_cup = { ...whereClauseProducto.costo_cup, [Op.gte]: filterCriteria[key] };
            break;
          case 'costo_cup_max':
            whereClauseProducto.costo_cup = { ...whereClauseProducto.costo_cup, [Op.lte]: filterCriteria[key] };
            break;
          case 'cantidad_min':
            whereClauseProducto.cantidad = { ...whereClauseProducto.cantidad, [Op.gte]: filterCriteria[key] };
            break;
          case 'cantidad_max':
            whereClauseProducto.cantidad = { ...whereClauseProducto.cantidad, [Op.lte]: filterCriteria[key] };
            break;
          case 'precio_usd_min':
            whereClauseComerciable.precio_usd = { ...whereClauseComerciable.precio_usd, [Op.gte]: filterCriteria[key] };
            break;
          case 'precio_usd_max':
            whereClauseComerciable.precio_usd = { ...whereClauseComerciable.precio_usd, [Op.lte]: filterCriteria[key] };
            break;
          case 'precio_cup_min':
            whereClauseComerciable.precio_cup = { ...whereClauseComerciable.precio_cup, [Op.gte]: filterCriteria[key] };
            break;
          case 'precio_cup_max':
            whereClauseComerciable.precio_cup = { ...whereClauseComerciable.precio_cup, [Op.lte]: filterCriteria[key] };
            break;
        }
      }
    }

    // Traer todos los productos que cumplan los criterios y luego filtrar por medicamento en memoria
    const allResults = await Producto.findAll({
      where: whereClauseProducto,
      include: [
        {
          model: Comerciable,
          required: true,
          where: whereClauseComerciable,
          include: [
            {
              model: Venta,
              required: false,
              as: "venta",
            }
          ]
        },
        {
          model: Entrada,
          required: false,
          as: "entradas"
        },
        {
          model: Medicamento,
          required: false,
        }
      ]
    });

    // Filtrar productos que NO sean medicamentos
    const productosFiltrados = allResults.filter(producto => !producto.medicamento);

    // Aplicar paginación después del filtrado
    const paginatedResults = productosFiltrados.slice(offset, offset + limit);

    return {
      count: productosFiltrados.length,
      rows: paginatedResults,
    };
  } catch (error) {
    console.error("Error en el servicio de filtrar productos:", error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al filtrar productos');
      err.errors = [error.message || 'Error interno al filtrar productos'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getUniqueCode = async () => {
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = Math.floor(10000 + Math.random() * 90000).toString();
    isUnique = !(await productoExistsByCodigo(code));
  }
  return code;
};

module.exports = {
  getAllProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  filterProductosPaginated,
  productoExistsByCodigo,
  getUniqueCode,
};
