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
                        as: 'servicio_complejo',
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
                        as: 'servicio_complejo',
                        required: false
                    }
                ]
            }
        ]
    });
};

const filterComerciablesPaginated = async (filterCriteria, limit, offset) => {
    // Extraer flags especiales, coerciéndolos a booleanos si vienen como strings/números
    const parseBool = (v) => {
        if (v === true || v === 'true' || v === 1 || v === '1') return true;
        if (v === false || v === 'false' || v === 0 || v === '0') return false;
        return undefined;
    };

    const isProducto = filterCriteria.hasOwnProperty('isProducto') ? parseBool(filterCriteria.isProducto) : undefined;
    const isMedicamento = filterCriteria.hasOwnProperty('isMedicamento') ? parseBool(filterCriteria.isMedicamento) : undefined;
    const isServicio = filterCriteria.hasOwnProperty('isServicio') ? parseBool(filterCriteria.isServicio) : undefined;
    const isServicioComplejo = filterCriteria.hasOwnProperty('isServicioComplejo') ? parseBool(filterCriteria.isServicioComplejo) : undefined;

    delete filterCriteria.isProducto;
    delete filterCriteria.isMedicamento;
    delete filterCriteria.isServicio;
    delete filterCriteria.isServicioComplejo;

    const whereClause = {};
    const whereProducto = {};
    const whereServicio = {};

    // Procesar criterios de filtro: separarlos según la tabla a la que pertenecen
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
            } else if (key === 'nombre') {
                // 'nombre' pertenece a Producto, no a Comerciable
                whereProducto.nombre = { [Op.iLike]: `%${filterCriteria[key]}%` };
            } else if (key === 'descripcion') {
                // 'descripcion' pertenece a Servicio, no a Comerciable
                whereServicio.descripcion = { [Op.iLike]: `%${filterCriteria[key]}%` };
            }
            // Ignorar otros criterios que no existan en Comerciable
        }
    }

    // Traer los resultados que coincidan con los criterios básicos
    const allResults = await Comerciable.findAll({
        where: whereClause,
        include: [
            {
                model: Producto,
                required: false,
                where: Object.keys(whereProducto).length > 0 ? whereProducto : undefined,
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
                where: Object.keys(whereServicio).length > 0 ? whereServicio : undefined,
                include: [
                    {
                        model: ServicioComplejo,
                        as: 'servicio_complejo',
                        required: false
                    }
                ]
            }
        ]
    });

    // Filtrar en memoria según los flags (si fueron provistos)
    const filtered = allResults.filter(c => {
        if (typeof isProducto !== 'undefined') {
            const hasProducto = !!c.producto;
            if (isProducto && !hasProducto) return false;
            if (!isProducto && hasProducto) return false;
        }
        if (typeof isMedicamento !== 'undefined') {
            const hasMedicamento = !!(c.producto && c.producto.medicamento);
            if (isMedicamento && !hasMedicamento) return false;
            if (!isMedicamento && hasMedicamento) return false;
        }
        if (typeof isServicio !== 'undefined') {
            const hasServicio = !!c.servicio;
            if (isServicio && !hasServicio) return false;
            if (!isServicio && hasServicio) return false;
        }
        if (typeof isServicioComplejo !== 'undefined') {
            const hasServicioComplejo = !!(c.servicio && c.servicio.servicio_complejo);
            if (isServicioComplejo && !hasServicioComplejo) return false;
            if (!isServicioComplejo && hasServicioComplejo) return false;
        }
        return true;
    });

    // Aplicar paginación sobre el conjunto filtrado
    const paginated = filtered.slice(offset, offset + limit);

    return {
        count: filtered.length,
        rows: paginated
    };
};

module.exports = {
    getAllComerciables,
    getComerciableById,
    filterComerciablesPaginated
};
