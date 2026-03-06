const { Entrada } = require("../models/entrada");
const { Producto } = require("../models/producto");
const { Usuario } = require("../models/usuario");
const { Comerciable } = require("../models/comerciable");
const { Medicamento } = require("../models/medicamento");
const productoService = require("./productoService");
const usuarioService = require("./usuarioService");
const sequelize = require("../helpers/database");
const { Op } = require('sequelize');


const getEntradaById = async (id, transaction) => {
    const entrada = await Entrada.findOne({
        where: { id_entrada: id },
        include: [
            {
                model: Usuario,
                required: true,
                as: "usuario"
            },
            {
                model: Producto,
                required: true,
                as: "producto",
                include: [
                    {
                        model: Comerciable,
                        required: true,
                    },
                    {
                        model: Medicamento,
                        required: false,
                    }
                ]
            }
        ],
        transaction
    });
    return entrada;
};

const createEntrada = async (entradaData) => {
    const t = await sequelize.transaction();
    try {
        const { id_usuario, id_comerciable, cantidad } = entradaData;

        const usuario = await usuarioService.getUsuarioById(id_usuario, t);
        if (!usuario) {
            throw new Error(`El usuario proporcionado no existe.`);
        }

        const producto = await productoService.getProductoById(id_comerciable, t);
        if (!producto) {
            throw new Error(`El producto o medicamneto proporionado no existe.`);
        }

        const newEntrada = await Entrada.create(entradaData, { transaction: t });

        const nuevaCantidad = producto.cantidad + cantidad;
        await producto.update({ cantidad: nuevaCantidad }, { transaction: t });

        await t.commit();
        return await getEntradaById(newEntrada.id_entrada);
    } catch (error) {
        await t.rollback();
        console.log("Error en el servicio de crear entrada: ", error);
        const err = new Error(error.message || 'Error interno al crear la entrada');
        err.errors = [error.message || 'Error interno al crear la entrada'];
        err.status = error.status || 500;
        throw err;
    }
};

const updateEntrada = async (id, entradaData) => {
    const t = await sequelize.transaction();
    try {
        const entrada = await Entrada.findOne({ where: { id_entrada: id }, transaction: t });
        if (!entrada) {
            await t.rollback();
            const error = new Error(`Entrada con ID ${id} no encontrado`);
            error.status = 404;
            throw error;
        }

        // Obtener el producto actual
        const productoActual = await productoService.getProductoById(entrada.id_comerciable, t);
        if (!productoActual) {
            throw new Error(`El producto o medicamento asociado no existe.`);
        }

        // Determinar valores anteriores y nuevos
        const cantidadOriginal = entrada.cantidad;
        const cantidadNueva = entradaData.cantidad !== undefined ? entradaData.cantidad : cantidadOriginal;
        const id_comerciableOriginal = entrada.id_comerciable;
        const id_comerciableNuevo = entradaData.id_comerciable !== undefined ? entradaData.id_comerciable : id_comerciableOriginal;

        // CASO 1: Cambió el producto
        if (id_comerciableNuevo !== id_comerciableOriginal) {
            // Obtener el nuevo producto
            const productoNuevo = await productoService.getProductoById(id_comerciableNuevo, t);
            if (!productoNuevo) {
                throw new Error(`El nuevo producto o medicamento proporcionado no existe.`);
            }

            // Restar la cantidad del producto anterior (esa entrada ya no le pertenece)
            const cantidadProductoActualAjustada = productoActual.cantidad - cantidadOriginal;
            if (cantidadProductoActualAjustada < 0) {
                throw new Error(`No hay suficiente cantidad en el producto actual para desvincular la entrada. Cantidad actual: ${productoActual.cantidad}, se intenta restar: ${cantidadOriginal}`);
            }
            await productoActual.update({ cantidad: cantidadProductoActualAjustada }, { transaction: t });

            // Sumar la cantidad al nuevo producto (ahora esa entrada le pertenece)
            const cantidadProductoNuevo = productoNuevo.cantidad + cantidadNueva;
            await productoNuevo.update({ cantidad: cantidadProductoNuevo }, { transaction: t });
        }
        // CASO 2: Solo cambió la cantidad
        else if (cantidadNueva !== cantidadOriginal) {
            const diferenciaCantidad = cantidadNueva - cantidadOriginal;
            const nuevaCantidadProducto = productoActual.cantidad + diferenciaCantidad;
            
            if (nuevaCantidadProducto < 0) {
                throw new Error(`No hay suficiente cantidad para realizar el ajuste. Cantidad actual: ${productoActual.cantidad}, se intenta restar: ${-diferenciaCantidad}`);
            }
            await productoActual.update({ cantidad: nuevaCantidadProducto }, { transaction: t });
        }

        // Actualizar la entrada con los nuevos datos
        await entrada.update(entradaData, { transaction: t });

        await t.commit();
        return await getEntradaById(id);
    } catch (error) {
        await t.rollback();
        console.log("Error en el servicio de actualizar entrada: ", error);
        const err = new Error(error.message || 'Error interno al actualizar la entrada');
        err.errors = [error.message || 'Error interno al actualizar la entrada'];
        err.status = error.status || 500;
        throw err;
    }
};

const deleteEntrada = async (id) => {
    const t = await sequelize.transaction();
    try {
        const entrada = await Entrada.findOne({ where: { id_entrada: id }, transaction: t });
        if (!entrada) {
            await t.rollback();
            return false;
        }

        const producto = await productoService.getProductoById(entrada.id_comerciable, t);
        if (!producto) {
            throw new Error(`El producto asociado con ID ${entrada.id_comerciable} no existe.`);
        }

        const nuevaCantidad = producto.cantidad - entrada.cantidad;
        if (nuevaCantidad < 0) {
            const error = new Error(`No hay suficiente stock para eliminar la entrada. Stock actual: ${producto.cantidad}, se intenta restar: ${entrada.cantidad}`);
            error.status = 400;
            throw error;
        }
        await producto.update({ cantidad: nuevaCantidad }, { transaction: t });

        await entrada.destroy({ transaction: t });

        await t.commit();
        return true;
    } catch (error) {
        await t.rollback();
        console.error("Error en el servicio de eliminar entrada:", error);
        const err = new Error(error.message || 'Error interno al eliminar la entrada');
        err.errors = [error.message || 'Error interno al eliminar la entrada'];
        err.status = error.status || 500;
        throw err;
    }
};

const filterEntradasPaginated = async (filterCriteria, limit, offset) => {
    try {
        const whereClauseEntrada = {};
        const whereClauseUsuario = {};
        const whereClauseProducto = {};

        // Construcción dinámica de filtros
        for (const key in filterCriteria) {
            if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
                switch (key) {
                    case 'fecha_desde':
                        whereClauseEntrada.fecha = { ...whereClauseEntrada.fecha, [Op.gte]: filterCriteria[key] };
                        break;
                    case 'fecha_hasta':
                        whereClauseEntrada.fecha = { ...whereClauseEntrada.fecha, [Op.lte]: filterCriteria[key] };
                        break;
                    case 'cantidad_min':
                        whereClauseEntrada.cantidad = { ...whereClauseEntrada.cantidad, [Op.gte]: filterCriteria[key] };
                        break;
                    case 'cantidad_max':
                        whereClauseEntrada.cantidad = { ...whereClauseEntrada.cantidad, [Op.lte]: filterCriteria[key] };
                        break;
                    case 'costo_cup_min':
                        whereClauseEntrada.costo_cup = { ...whereClauseEntrada.costo_cup, [Op.gte]: filterCriteria[key] };
                        break;
                    case 'costo_cup_max':
                        whereClauseEntrada.costo_cup = { ...whereClauseEntrada.costo_cup, [Op.lte]: filterCriteria[key] };
                        break;
                    case 'costo_usd_min':
                        whereClauseEntrada.costo_usd = { ...whereClauseEntrada.costo_usd, [Op.gte]: filterCriteria[key] };
                        break;
                    case 'costo_usd_max':
                        whereClauseEntrada.costo_usd = { ...whereClauseEntrada.costo_usd, [Op.lte]: filterCriteria[key] };
                        break;
                    case 'nombre_proveedor':
                        whereClauseEntrada.nombre_proveedor = { [Op.iLike]: `%${filterCriteria[key]}%` };
                        break;
                    case 'nombre_usuario':
                        whereClauseUsuario.nombre_natural = { [Op.iLike]: `%${filterCriteria[key]}%` };
                        break;
                    case 'nombre_producto':
                        whereClauseProducto.nombre = { [Op.iLike]: `%${filterCriteria[key]}%` };
                        break;
                }
            }
        }

        // Construcción de includes para la consulta principal
        const includeOptions = [
            {
                model: Usuario,
                as: 'usuario',
                where: whereClauseUsuario,
                required: true
            },
            {
                model: Producto,
                as: 'producto',
                where: whereClauseProducto,
                required: true,
                include: [
                    { model: Comerciable, required: true },
                    { model: Medicamento, required: false }
                ]
            }
        ];

        // Consulta principal con paginación
        const { count, rows } = await Entrada.findAndCountAll({
            where: whereClauseEntrada,
            limit,
            offset,
            include: includeOptions,
            order: [['fecha', 'DESC']]
        });

        // CONSULTA SEPARADA PARA LAS SUMATORIAS
        // Primero obtenemos los IDs de las entradas que cumplen con todos los filtros
        const entradasFiltradas = await Entrada.findAll({
            where: whereClauseEntrada,
            include: includeOptions,
            attributes: ['id_entrada'],
            raw: true
        });

        const idsEntradasFiltradas = entradasFiltradas.map(entrada => entrada.id_entrada);

        // Luego calculamos las sumatorias solo de esas entradas
        let totalCantidad = 0;
        let totalCostoCup = 0;
        let totalCostoUsd = 0;

        if (idsEntradasFiltradas.length > 0) {
            const sumResult = await Entrada.findAll({
                where: {
                    id_entrada: {
                        [Op.in]: idsEntradasFiltradas
                    }
                },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_cantidad'],
                    [sequelize.fn('SUM', sequelize.col('costo_cup')), 'total_costo_cup'],
                    [sequelize.fn('SUM', sequelize.col('costo_usd')), 'total_costo_usd']
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
        console.error("❌ Error en el servicio de filtrar entradas:", error);
        const err = new Error(error.message || 'Error interno al filtrar entradas');
        err.errors = [error.message || 'Error interno al filtrar entradas'];
        err.status = error.status || 500;
        throw err;
    }
};

const getAllEntradas = async () => {
    try {
        const entradas = await Entrada.findAll({
            include: [
                {
                    model: Usuario,
                    required: true,
                    as: "usuario"
                },
                {
                    model: Producto,
                    required: true,
                    as: "producto",
                    include: [
                        {
                            model: Comerciable,
                            required: true,
                        },
                        {
                            model: Medicamento,
                            required: false,
                        }
                    ]
                }
            ],
            order: [['fecha', 'DESC']]
        });
        return entradas;
    } catch (error) {
        console.error("Error en el servicio de obtener todas las entradas:", error);
        const err = new Error(error.message || 'Error interno al obtener las entradas');
        err.errors = [error.message || 'Error interno al obtener las entradas'];
        err.status = error.status || 500;
        throw err;
    }
};

const getEntradasByComerciable = async (id_comerciable) => {
    try {
        const entradas = await Entrada.findAll({
            where: { id_comerciable },
            include: [
                {
                    model: Usuario,
                    required: true,
                    as: "usuario"
                },
                {
                    model: Producto,
                    required: true,
                    as: "producto",
                    include: [
                        { model: Comerciable, required: true },
                        { model: Medicamento, required: false }
                    ]
                }
            ],
            order: [['fecha', 'DESC']]
        });
        return entradas;
    } catch (error) {
        console.error("Error en getEntradasByComerciable:", error);
        const err = new Error(error.message || 'Error interno al obtener entradas por comerciable');
        err.errors = [error.message || 'Error interno al obtener entradas por comerciable'];
        err.status = error.status || 500;
        throw err;
    }
};

module.exports = {
    getEntradaById,
    createEntrada,
    updateEntrada,
    deleteEntrada,
    filterEntradasPaginated,
    getAllEntradas,
    getEntradasByComerciable,
};
