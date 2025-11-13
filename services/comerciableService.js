const { Comerciable } = require("../models/comerciable");
const { Op } = require('sequelize');

const getAllComerciables = async () => {
    return await Comerciable.findAll();
};

const getComerciableById = async (id) => {
    return await Comerciable.findByPk(id);
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
        offset
    });
};

module.exports = {
    getAllComerciables,
    getComerciableById,
    filterComerciablesPaginated
};
