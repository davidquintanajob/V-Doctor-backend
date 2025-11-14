const servicioComplejoService = require('../services/servicioComplejoService');
const { roles } = require('../models/usuario');

const getServicioComplejoById = async (req, res) => {
    try {
        const servicioComplejo = await servicioComplejoService.getServicioComplejoById(req.params.id);
        if (!servicioComplejo) {
            return res.status(404).json({ error: ['Servicio complejo no encontrado'] });
        }
        res.json(servicioComplejo);
    } catch (error) {
        res.status(500).json({ error: [error.message] });
    }
};

const createServicioComplejo = async (req, res) => {
    const { roles_autorizados } = req.body;
    try {
        const { descripcion, tipo_servicio, foto_servicio_complejo } = req.body;
        if (!descripcion || !tipo_servicio) {
            return res.status(400).json({ error: ['La descripción y el tipo de servicio son obligatorios.'] });
        }
        if (foto_servicio_complejo && !Array.isArray(foto_servicio_complejo)) {
            return res.status(400).json({ error: ['El campo foto_servicio_complejo debe ser una lista.'] });
        }
        if (roles_autorizados) {
            const rolesArray = roles_autorizados.split(',').map(role => role.trim());
            for (const role of rolesArray) {
                if (!roles.includes(role)) {
                    return res.status(400).json({ error: [`El rol especificado '${role}' no es válido.`] });
                }
            }
        }
        const nuevoServicioComplejo = await servicioComplejoService.createServicioComplejo(req.body);
        res.status(201).json(nuevoServicioComplejo);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.error || [error.message] });
    }
};

const updateServicioComplejo = async (req, res) => {
    const { roles_autorizados } = req.body;
    try {
        const { foto_servicio_complejo } = req.body;
        if (foto_servicio_complejo && !Array.isArray(foto_servicio_complejo)) {
            return res.status(400).json({ error: ['El campo foto_servicio_complejo debe ser una lista.'] });
        }
        if (roles_autorizados) {
            const rolesArray = roles_autorizados.split(',').map(role => role.trim());
            for (const role of rolesArray) {
                if (!roles.includes(role)) {
                    return res.status(400).json({ error: [`El rol especificado '${role}' no es válido.`] });
                }
            }
        }
        const servicioComplejoActualizado = await servicioComplejoService.updateServicioComplejo(req.params.id, req.body);
        res.json(servicioComplejoActualizado);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.error || [error.message] });
    }
};

const deleteServicioComplejo = async (req, res) => {
    try {
        await servicioComplejoService.deleteServicioComplejo(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(error.status || 500).json({ error: error.error || [error.message] });
    }
};

const filterServiciosComplejosPaginated = async (req, res) => {
    try {
        const { limit, page } = req.params;
        const filterCriteria = req.body;
        const offset = (page - 1) * limit;
        const result = await servicioComplejoService.filterServiciosComplejosPaginated(filterCriteria, parseInt(limit), offset);
        res.json(result);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
};

const getAllServiciosComplejos = async (req, res) => {
    try {
        const serviciosComplejos = await servicioComplejoService.getAllServiciosComplejos();
        res.json(serviciosComplejos);
    } catch (error) {
        res.status(500).json({ error: [error.message] });
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
