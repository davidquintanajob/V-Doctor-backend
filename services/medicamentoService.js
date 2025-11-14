const { Medicamento } = require("../models/medicamento");
const { Producto } = require("../models/producto");
const { Comerciable } = require("../models/comerciable");
const { Venta } = require("../models/venta");
const { Entrada } = require("../models/entrada");
const productoService = require("./productoService");
const sequelize = require("../helpers/database");
const { Op } = require('sequelize');

const getMedicamentoById = async (id, transaction) => {
    return await Medicamento.findOne({
        where: { id_comerciable: id },
        include: [
            {
                model: Producto,
                required: true,
                include: [
                    {
                        model: Comerciable,
                        required: true,
                        include: [
                            {
                                model: Venta,
                                required: false,
                            }
                        ]
                    },
                    {
                        model: Entrada,
                        required: false,
                        as: "entradas"
                    }
                ]
            }
        ],
        transaction
    });
};

const getAllMedicamentos = async () => {
    return await Medicamento.findAll({
        include: [
            {
                model: Producto,
                required: true,
                include: [
                    {
                        model: Comerciable,
                        required: true,
                        include: [
                            {
                                model: Venta,
                                required: false,
                            }
                        ]
                    },
                    {
                        model: Entrada,
                        required: false,
                        as: "entradas"
                    }
                ]
            }
        ]
    });
};

const createMedicamento = async (medicamentoData) => {
    const t = await sequelize.transaction();
    try {
        const producto = await productoService.createProducto(medicamentoData, t);

        const newMedicamentoData = { ...medicamentoData };
        newMedicamentoData.id_comerciable = producto.id_comerciable;

        await Medicamento.create(newMedicamentoData, { transaction: t });

        await t.commit();

        return await getMedicamentoById(producto.id_comerciable);
    } catch (error) {
        await t.rollback();
        console.log("Error en el servicio de crear medicamento: ", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al crear medicamento');
            err.errors = [error.message || 'Error interno al crear medicamento'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

const updateMedicamento = async (id, medicamentoData) => {
    const t = await sequelize.transaction();
    try {
        const producto = await productoService.updateProducto(id, medicamentoData, t);
        if (!producto) {
            await t.rollback();
            return null;
        }

        const medicamento = await Medicamento.findOne({ where: { id_comerciable: id }, transaction: t });
        if (medicamento) {
            await medicamento.update(medicamentoData, { transaction: t });
        }

        await t.commit();
        return await getMedicamentoById(id);
    } catch (error) {
        await t.rollback();
        console.log("Error en el servicio de actualizar medicamento: ", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al actualizar medicamento');
            err.errors = [error.message || 'Error interno al actualizar medicamento'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

const deleteMedicamento = async (id) => {
    const t = await sequelize.transaction();
    try {
        const medicamento = await Medicamento.findOne({ where: { id_comerciable: id }, transaction: t });
        if (!medicamento) {
            await t.rollback();
            return false;
        }

        await medicamento.destroy({ transaction: t });
        await productoService.deleteProducto(id, t);

        await t.commit();
        return true;
    } catch (error) {
        await t.rollback();
        console.error("Error en el servicio de eliminar medicamento:", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al eliminar medicamento');
            err.errors = [error.message || 'Error interno al eliminar medicamento'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

const filterMedicamentosPaginated = async (filterCriteria, limit, offset) => {
    try {
        const whereClauseProducto = {};
        const whereClauseComerciable = {};
        const whereClauseMedicamento = {};

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
                        whereClauseProducto.codigo = { [Op.eq]: filterCriteria[key] };
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
                    case 'tipo_medicamento':
                        whereClauseMedicamento.tipo_medicamento = { [Op.iLike]: `%${filterCriteria[key]}%` };
                        break;
                    case 'unidad_medida':
                        whereClauseMedicamento.unidad_medida = { [Op.iLike]: `%${filterCriteria[key]}%` };
                        break;
                    case 'posologia':
                        whereClauseMedicamento.posologia = { [Op.iLike]: `%${filterCriteria[key]}%` };
                        break;
                }
            }
        }

        const result = await Medicamento.findAndCountAll({
            where: whereClauseMedicamento,
            limit,
            offset,
            include: [
                {
                    model: Producto,
                    required: true,
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
                                }
                            ]
                        },
                        {
                            model: Entrada,
                            required: false,
                            as: "entradas"
                        }
                    ]
                }
            ]
        });
        return result;
    } catch (error) {
        console.error("Error en el servicio de filtrar medicamentos:", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al filtrar medicamentos');
            err.errors = [error.message || 'Error interno al filtrar medicamentos'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

module.exports = {
    getAllMedicamentos,
    getMedicamentoById,
    createMedicamento,
    updateMedicamento,
    deleteMedicamento,
    filterMedicamentosPaginated,
};
