const servicioService = require('../services/servicioService');
const { roles } = require('../models/usuario');

const getAllServicios = async (req, res) => {
    try {
        const servicios = await servicioService.getAllServicios();
        res.status(200).json(servicios);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const getServicioById = async (req, res) => {
    try {
        const { id } = req.params;
        const servicio = await servicioService.getServicioById(id);
        if (!servicio) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        res.status(200).json(servicio);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const createServicio = async (req, res) => {
    const { descripcion, precio_usd, precio_cup, roles_autorizados } = req.body;
    const errors = [];

    if (roles_autorizados) {
        const rolesArray = roles_autorizados.split(',').map(role => role.trim());
        for (const role of rolesArray) {
            if (!roles.includes(role)) {
                errors.push(`El rol especificado '${role}' no es válido.`);
            }
        }
    }

    if (!descripcion) errors.push("La descripción es requerida");
    if (!precio_usd) errors.push("El precio_usd es requerido");
    if (!precio_cup) errors.push("El precio_cup es requerido");

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const newServicio = await servicioService.createServicio(req.body);
        res.status(201).json(newServicio);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const updateServicio = async (req, res) => {
    const { roles_autorizados } = req.body;
    const errors = [];

    if (roles_autorizados) {
        const rolesArray = roles_autorizados.split(',').map(role => role.trim());
        for (const role of rolesArray) {
            if (!roles.includes(role)) {
                errors.push(`El rol especificado '${role}' no es válido.`);
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const { id } = req.params;
        const servicioActualizado = await servicioService.updateServicio(id, req.body);
        if (!servicioActualizado) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        res.status(200).json(servicioActualizado);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const deleteServicio = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await servicioService.deleteServicio(id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        res.status(200).json({ message: 'Servicio eliminado correctamente' });
    } catch (error) {
        if (error.message.includes("No se puede eliminar el servicio")) {
            return res.status(409).json({ error: error.message });
        }
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const filterServicios = async (req, res) => {
    try {
        const { limit, page } = req.params;
        const filterCriteria = req.body;

        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);

        if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
            return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
        }

        const offset = (pageNum - 1) * limitNum;

        const { rows: servicios, count: total } = await servicioService.filterServiciosPaginated(filterCriteria, limitNum, offset);

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            data: servicios,
            pagination: {
                total,
                currentPage: pageNum,
                limit: limitNum,
                totalPages
            }
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

module.exports = {
    getAllServicios,
    getServicioById,
    createServicio,
    updateServicio,
    deleteServicio,
    filterServicios,
};
