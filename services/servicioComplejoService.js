const { ServicioComplejo, TIPOS_SERVICIO } = require("../models/servicio_complejo");
const { Servicio } = require("../models/servicio");
const { Comerciable } = require("../models/comerciable");
const { Venta } = require("../models/venta");
const { FotoServicioComplejo } = require("../models/foto_servicio_complejo");
const { Calendario } = require("../models/calendario");
const sequelize = require("../helpers/database");
const { Op } = require('sequelize');
const servicioService = require('./servicioService');
const fs = require('fs').promises;
const path = require('path');

const getServicioComplejoById = async (id, transaction) => {
    return await ServicioComplejo.findOne({
        where: { id_comerciable: id },
        include: [
            {
                model: Servicio,
                as: 'servicio',
                required: true,
                include: [
                    {
                        model: Comerciable,
                        as: 'comerciable',
                        required: true,
                        include: [
                            {
                                model: Venta,
                                as: 'venta',
                                required: false,
                            }
                        ]
                    }
                ]
            },
            {
                model: Venta,
                as: 'venta',
                required: false,
            },

            {
                model: Calendario,
                required: false,
            }
        ],
        transaction
    });
};

const createServicioComplejo = async (servicioComplejoData) => {
    const t = await sequelize.transaction();
    try {
        const { calendario, foto_servicio_complejo, ...servicioData } = servicioComplejoData;

        if (!TIPOS_SERVICIO.includes(servicioData.tipo_servicio)) {
            const error = new Error(`El tipo de servicio '${servicioData.tipo_servicio}' no es válido.`);
            error.status = 400;
            throw error;
        }

        if (calendario) {
            const { fecha, descripcion, id_usuario } = calendario;
            if (!fecha || !descripcion || !id_usuario) {
                const error = new Error('Los campos fecha, descripcion y id_usuario son obligatorios para el calendario.');
                error.status = 400;
                throw error;
            }
        }

        const servicio = await servicioService.createServicio(servicioData, t);

        const newServicioComplejoData = {
            id_comerciable: servicio.id_comerciable,
            tipo_servicio: servicioData.tipo_servicio,
        };

        const servicioComplejo = await ServicioComplejo.create(newServicioComplejoData, { transaction: t });

        if (calendario) {
            await Calendario.create({
                ...calendario,
                id_comerciable_servicio_complejo: servicio.id_comerciable,
            }, { transaction: t });
        }

        // Fotos de servicio complejos ahora se gestionan por venta. Ignorar fotos en la creación del servicio complejo.

        await t.commit();
        return await getServicioComplejoById(servicioComplejo.id_comerciable);
    } catch (error) {
        await t.rollback();
        console.log("Error en el servicio de crear servicio complejo: ", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al crear servicio complejo');
            err.errors = [error.message || 'Error interno al crear servicio complejo'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

const updateServicioComplejo = async (id, servicioComplejoData) => {
    const t = await sequelize.transaction();
    try {
        const { calendario, foto_servicio_complejo, ...servicioData } = servicioComplejoData;

        const servicioComplejo = await ServicioComplejo.findOne({ where: { id_comerciable: id }, transaction: t });
        if (!servicioComplejo) {
            await t.rollback();
            const error = new Error(`Servicio complejo con ID ${id} no encontrado`);
            error.status = 404;
            throw error;
        }

        if (servicioData.tipo_servicio && !TIPOS_SERVICIO.includes(servicioData.tipo_servicio)) {
            const error = new Error(`El tipo de servicio '${servicioData.tipo_servicio}' no es válido.`);
            error.status = 400;
            throw error;
        }

        if (calendario) {
            const { fecha, descripcion, id_usuario } = calendario;
            if (!fecha || !descripcion || !id_usuario) {
                const error = new Error('Los campos fecha, descripcion y id_usuario son obligatorios para el calendario.');
                error.status = 400;
                throw error;
            }
        }

        await servicioService.updateServicio(id, servicioData, t);
        await servicioComplejo.update(servicioData, { transaction: t });

        if (calendario) {
            await Calendario.destroy({ where: { id_comerciable_servicio_complejo: id }, transaction: t });
            await Calendario.create({
                ...calendario,
                id_comerciable_servicio_complejo: id,
            }, { transaction: t });
        }

        // Fotos de servicio complejo se administran a través de las ventas. Ignorar modificaciones de fotos aquí.

        await t.commit();
        return await getServicioComplejoById(id);
    } catch (error) {
        await t.rollback();
        console.log("Error en el servicio de actualizar servicio complejo: ", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al actualizar servicio complejo');
            err.errors = [error.message || 'Error interno al actualizar servicio complejo'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

const deleteServicioComplejo = async (id) => {
    const t = await sequelize.transaction();
    try {
        const servicioComplejo = await ServicioComplejo.findOne({
            where: { id_comerciable: id },
            transaction: t
        });

        if (!servicioComplejo) {
            await t.rollback();
            const error = new Error(`Servicio complejo con ID ${id} no encontrado`);
            error.status = 404;
            throw error;
        }

        // Validar que no haya ventas relacionadas
        const ventasRelacionadas = await Venta.count({
            where: { id_servicio_complejo: id },
            transaction: t
        });

        if (ventasRelacionadas > 0) {
            await t.rollback();
            const error = new Error(`Este servicio complejo tiene ${ventasRelacionadas} venta(s) relacionada(s). No se puede eliminar un servicio complejo que tiene ventas asociadas.`);
            error.status = 409;
            throw error;
        }

        // Eliminar fotos asociadas a las ventas de este servicio complejo
        const ventas = await Venta.findAll({
            where: { id_servicio_complejo: id },
            transaction: t
        });

        for (const venta of ventas) {
            const fotos = await FotoServicioComplejo.findAll({
                where: { id_venta: venta.id_venta },
                transaction: t
            });

            for (const foto of fotos) {
                if (foto.ruta) {
                    try {
                        await fs.unlink(path.join(__dirname, '..', foto.ruta));
                    } catch (err) {
                        console.error(`Failed to delete file: ${foto.ruta}`, err);
                    }
                }
            }

            await FotoServicioComplejo.destroy({
                where: { id_venta: venta.id_venta },
                transaction: t
            });
        }

        await Calendario.destroy({
            where: { id_comerciable_servicio_complejo: id },
            transaction: t
        });

        await servicioComplejo.destroy({ transaction: t });
        await servicioService.deleteServicio(id, t);

        await t.commit();
        return true;

    } catch (error) {
        // VERIFICAR si la transacción ya fue finalizada
        if (t && !t.finished) {
            await t.rollback();
        }

        console.error("Error en el servicio de eliminar servicio complejo:", error);

        // Si el error ya tiene status (de los rollbacks anteriores), lanzarlo tal cual
        if (error.status) {
            throw error;
        }

        // Si es un error no esperado, crear uno nuevo
        const err = new Error(error.message || 'Error interno al eliminar servicio complejo');
        err.errors = [error.message || 'Error interno al eliminar servicio complejo'];
        err.status = error.status || 500;
        throw err;
    }
};

const filterServiciosComplejosPaginated = async (filterCriteria, limit, offset) => {
    try {
        const whereClauseServicioComplejo = {};
        const whereClauseServicio = {};
        const whereClauseComerciable = {};

        for (const key in filterCriteria) {
            if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
                switch (key) {
                    case 'tipo_servicio':
                        whereClauseServicioComplejo[Op.and] = [
                            sequelize.where(
                                sequelize.cast(sequelize.col('tipo_servicio'), 'varchar'),
                                { [Op.iLike]: `%${filterCriteria[key]}%` }
                            )
                        ];
                        break;
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

        const { count, rows } = await ServicioComplejo.findAndCountAll({
            where: whereClauseServicioComplejo,
            limit,
            offset,
            include: [
                {
                    model: Servicio,
                    as: 'servicio',
                    where: whereClauseServicio,
                    required: true,
                    include: [
                        {
                            model: Comerciable,
                            as: 'comerciable',
                            where: whereClauseComerciable,
                            required: true,
                            include: [
                                {
                                    model: Venta,
                                    as: 'venta',
                                    required: false,
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Venta,
                    as: 'venta',
                    required: false,
                },

                {
                    model: Calendario,
                    required: false,
                }
            ]
        });

        return { count, rows };
    } catch (error) {
        console.error("Error en el servicio de filtrar servicio complejo:", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al filtrar servicios complejos');
            err.errors = [error.message || 'Error interno al filtrar servicios complejos'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

const getAllServiciosComplejos = async () => {
    try {
        return await ServicioComplejo.findAll({
            include: [
                {
                    model: Servicio,
                    as: 'servicio',
                    required: true,
                    include: [
                        {
                            model: Comerciable,
                            as: 'comerciable',
                            required: true,
                            include: [
                                {
                                    model: Venta,
                                    as: 'venta',
                                    required: false,
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Venta,
                    as: 'venta',
                    required: false,
                },

                {
                    model: Calendario,
                    required: false,
                }
            ]
        });
    } catch (error) {
        console.error("Error en el servicio de obtener todos los servicios complejos:", error);
        if (!error.errors || !Array.isArray(error.errors)) {
            const err = new Error(error.message || 'Error interno al obtener todos los servicios complejos');
            err.errors = [error.message || 'Error interno al obtener todos los servicios complejos'];
            err.status = error.status || 500;
            throw err;
        }
        throw error;
    }
};

module.exports = {
    getServicioComplejoById,
    createServicioComplejo,
    updateServicioComplejo,
    deleteServicioComplejo,
    filterServiciosComplejosPaginated,
    getAllServiciosComplejos,
};
