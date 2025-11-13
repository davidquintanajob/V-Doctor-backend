const { Comerciable } = require("../models/comerciable");
const { Producto } = require("../models/producto");
const { Servicio } = require("../models/servicio");
const { Medicamento } = require("../models/medicamento");
const { ServicioComplejo } = require("../models/servicio_complejo");
const { Op } = require('sequelize');

const getAllComerciables = async () => {
    return await Comerciable.findAll({
        include: [
            {
                model: Producto,
                required: false,
                include: [
                    {
                        model: Medicamento,
                        required: false
                    }
                ]
            },
            {
                model: Servicio,
                required: false,
                include: [
                    {
                        model: ServicioComplejo,
                        required: false
                    }
                ]
            }
        ]
    });
};

const getComerciableById = async (id) => {
    return await Comerciable.findByPk(id, {
        include: [
            {
                model: Producto,
                required: false,
                include: [
                    {
                        model: Medicamento,
                        required: false
                    }
                ]
            },
            {
                model: Servicio,
                required: false,
                include: [
                    {
                        model: ServicioComplejo,
                        required: false
                    }
                ]
            }
        ]
    });
};

const filterComerciablesPaginated = async (filterCriteria, limit, offset) => {
    const whereClause = {};

    for (const key in filterCriteria) {
        if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
            if (key === 'precio_cup_min' && filterCriteria.precio_cup_min) {
                whereClause.precio_cup = { ...whereClause.precio_cup, [Op.gte]: filterCriteria.precio_cup_min };
            } else if (key === 'precio_cup_max' && filterCriteria.precio_cup_max) {
                whereClause.precio_cup = { ...whereClause.precio_cup, [Op.lte]: filterCriteria.precio_cup_max };
            } else if (key === 'precio_usd_min' && filterCriteria.precio_usd_min) {
                whereClause.precio_usd = { ...whereClause.precio_usd, [Op.gte]: filterCriteria.precio_usd_min };
            } else if (key === 'precio_usd_max' && filterCriteria.precio_usd_max) {
                whereClause.precio_usd = { ...whereClause.precio_usd, [Op.lte]: filterCriteria.precio_usd_max };
            } else {
                whereClause[key] = { [Op.iLike]: `%${filterCriteria[key]}%` };
            }
        }
    }

    return await Comerciable.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        include: [
            {
                model: Producto,
                required: false,
                include: [
                    {
                        model: Medicamento,
                        required: false
                    }
                ]
            },
            {
                model: Servicio,
                required: false,
                include: [
                    {
                        model: ServicioComplejo,
                        required: false
                    }
                ]
            }
        ]
    });
};

module.exports = {
    getAllComerciables,
    getComerciableById,
    filterComerciablesPaginated
};
