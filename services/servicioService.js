const { Servicio } = require("../models/servicio");
const { ServicioComplejo } = require("../models/servicio_complejo");
const { Comerciable } = require("../models/comerciable");
const { Venta } = require("../models/venta");
const sequelize = require("../helpers/database");
const { Op } = require('sequelize');

const getAllServicios = async () => {
    try {
        const result = await Servicio.findAll({
            include: [
                {
                    model: Comerciable,
                    required: true,
                    as: "comerciable",
                    include: [
                        {
                            model: Venta,
                            required: false,
                            as: "venta",
                        }
                    ]
                },
                {
                    model: ServicioComplejo,
                    require: false,
                    as: "servicio_complejo"
                }
            ]
        });

        // Atento a la referencia "as" que se le da al servicio complejo para hacer esto
        servicios = result.filter(servicio => !servicio.servicio_complejo);
        
        return servicios;
    } catch (error) {
        console.log("Error en los servicios de getAllServicios: ", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al obtener servicios');
            err.errors = [error.message || 'Error interno al obtener servicios'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

const getServicioById = async (id, transaction) => {
    const servicio = await Servicio.findOne({
        where: { id_comerciable: id },
        include: [
            {
                model: Comerciable,
                required: true,
                as: "comerciable",
                include: [
                    {
                        model: Venta,
                        required: false,
                        as: "venta",
                    }
                ]
            },
            {
                model: ServicioComplejo,
                require: false,
                as: "servicio_complejo"
            }
        ],
        transaction
    });
    return servicio;
};

const createServicio = async (servicioData, transaction) => {
    const t = transaction || await sequelize.transaction();
    try {
        const comerciableData = {
            precio_usd: servicioData.precio_usd,
            precio_cup: servicioData.precio_cup,
            roles_autorizados: servicioData.roles_autorizados,
        };

        const comerciable = await Comerciable.create(comerciableData, { transaction: t });

        const newServicioData = { ...servicioData };
        newServicioData.id_comerciable = comerciable.id_comerciable;

        const servicio = await Servicio.create(newServicioData, { transaction: t });

        if (!transaction) {
            await t.commit();
            return await getServicioById(servicio.id_comerciable);
        }

        return await getServicioById(servicio.id_comerciable, t);

    } catch (error) {
        if (!transaction) {
            await t.rollback();
        }
        console.log("Error al en el servicio de crear servicio: ", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al crear servicio');
            err.errors = [error.message || 'Error interno al crear servicio'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

const updateServicio = async (id, servicioData, transaction) => {
    const t = transaction || await sequelize.transaction();
    try {
        const servicio = await Servicio.findOne({ where: { id_comerciable: id }, transaction: t });
        if (!servicio) {
            if (!transaction) {
                await t.rollback();
            }
            const error = new Error(`Servicio con ID ${id} no encontrado`);
            error.status = 404;
            throw error;
        }

        await servicio.update(servicioData, { transaction: t });

        if (servicioData.precio_usd || servicioData.precio_cup || servicioData.roles_autorizados) {
            const comerciable = await Comerciable.findOne({ where: { id_comerciable: id }, transaction: t });
            if (comerciable) {
                await comerciable.update(servicioData, { transaction: t });
            }
        }

        if (!transaction) {
            await t.commit();
        }
        return await getServicioById(id);
    } catch (error) {
        if (!transaction) {
            await t.rollback();
        }
        console.log("Error en el servicio de actualizar servicio: ", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al actualizar servicio');
            err.errors = [error.message || 'Error interno al actualizar servicio'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

const deleteServicio = async (id, transaction) => {
    const t = transaction || await sequelize.transaction();
    try {
        const venta = await Venta.findOne({ where: { id_comerciable: id }, transaction: t });
        if (venta) {
            throw new Error("No se puede eliminar el servicio porque está asociado a una venta.");
        }

        const servicio = await Servicio.findOne({ where: { id_comerciable: id }, transaction: t });
        if (!servicio) {
            if (!transaction) {
                await t.rollback();
            }
            const error = new Error(`Servicio con ID ${id} no encontrado`);
            error.status = 404;
            throw error;
        }

        await servicio.destroy({ transaction: t });

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
        console.error("Error en el servicio de eliminar servicio:", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al eliminar servicio');
            err.errors = [error.message || 'Error interno al eliminar servicio'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

const filterServiciosPaginated = async (filterCriteria, limit, offset) => {
    try {
        const whereClauseServicio = {};
        const whereClauseComerciable = {};

        for (const key in filterCriteria) {
            if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
                switch (key) {
                    case 'descripcion':
                        whereClauseServicio.descripcion = { [Op.iLike]: `%${filterCriteria[key]}%` };
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

        const result = await Servicio.findAndCountAll({
            where: whereClauseServicio,
            limit,
            offset,
            include: [
                {
                    model: Comerciable,
                    required: true,
                    where: whereClauseComerciable,
                    as: "comerciable",
                    include: [
                        {
                            model: Venta,
                            required: false,
                            as: "venta",
                        }
                    ]
                },
                {
                    model: ServicioComplejo,
                    required: false,
                    as: "servicio_complejo"
                }
            ]
        });

        // Atento a la referencia "as" que se le da al servicio complejo para hacer esto
        const serviciosFiltrados = result.rows.filter(servicio => !servicio.servicio_complejo);

        return {
            count: serviciosFiltrados.length,
            rows: serviciosFiltrados,
        };
    } catch (error) {
        console.error("Error en el servicio de filtrar servicio:", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al filtrar servicios');
            err.errors = [error.message || 'Error interno al filtrar servicios'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

module.exports = {
    getAllServicios,
    getServicioById,
    createServicio,
    updateServicio,
    deleteServicio,
    filterServiciosPaginated,
};
