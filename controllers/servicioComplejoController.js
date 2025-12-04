const servicioComplejoService = require('../services/servicioComplejoService');
const { roles } = require('../models/usuario');

const getServicioComplejoById = async (req, res) => {
    try {
        const servicioComplejo = await servicioComplejoService.getServicioComplejoById(req.params.id);
        if (!servicioComplejo) {
            return res.status(404).json({ error: ['Servicio complejo no encontrado'] });
        }
        
        // Transformar estructura: comerciable, servicio, servicio_complejo, venta del comerciable y ventas del servicio_complejo
        const transformed = {
            id_comerciable: servicioComplejo.id_comerciable,
            tipo_servicio: servicioComplejo.tipo_servicio,
            createdAt: servicioComplejo.createdAt,
            updatedAt: servicioComplejo.updatedAt,
            servicio: {
                id_comerciable: servicioComplejo.servicio.id_comerciable,
                descripcion: servicioComplejo.servicio.descripcion,
                createdAt: servicioComplejo.servicio.createdAt,
                updatedAt: servicioComplejo.servicio.updatedAt,
                comerciable: servicioComplejo.servicio.comerciable,
                venta: servicioComplejo.servicio.comerciable.venta || []
            },
            venta: servicioComplejo.venta || [],
            foto_servicio_complejos: servicioComplejo.foto_servicio_complejos || [],
            calendarios: servicioComplejo.calendarios || []
        };
        
        res.json(transformed);
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

        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);

        if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
            return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
        }

        const offset = (pageNum - 1) * limitNum;
        const { rows: serviciosComplejos, count: total } = await servicioComplejoService.filterServiciosComplejosPaginated(filterCriteria, limitNum, offset);

        const totalPages = Math.ceil(total / limitNum);

        // Transformar estructura: comerciable, servicio, servicio_complejo, venta del comerciable y ventas del servicio_complejo
        const transformedData = serviciosComplejos.map(sc => ({
            id_comerciable: sc.id_comerciable,
            tipo_servicio: sc.tipo_servicio,
            createdAt: sc.createdAt,
            updatedAt: sc.updatedAt,
            servicio: {
                id_comerciable: sc.servicio.id_comerciable,
                descripcion: sc.servicio.descripcion,
                createdAt: sc.servicio.createdAt,
                updatedAt: sc.servicio.updatedAt,
                comerciable: sc.servicio.comerciable,
                venta: sc.servicio.comerciable.venta || []
            },
            venta: sc.venta || [],
            foto_servicio_complejos: sc.foto_servicio_complejos || [],
            calendarios: sc.calendarios || []
        }));

        res.status(200).json({
            data: transformedData,
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

const getAllServiciosComplejos = async (req, res) => {
    try {
        const serviciosComplejos = await servicioComplejoService.getAllServiciosComplejos();
        
        // Transformar estructura para cada servicio complejo
        const transformedData = serviciosComplejos.map(sc => ({
            id_comerciable: sc.id_comerciable,
            tipo_servicio: sc.tipo_servicio,
            createdAt: sc.createdAt,
            updatedAt: sc.updatedAt,
            servicio: {
                id_comerciable: sc.servicio.id_comerciable,
                descripcion: sc.servicio.descripcion,
                createdAt: sc.servicio.createdAt,
                updatedAt: sc.servicio.updatedAt,
                comerciable: sc.servicio.comerciable,
                venta: sc.servicio.comerciable.venta || []
            },
            venta: sc.venta || [],
            foto_servicio_complejos: sc.foto_servicio_complejos || [],
            calendarios: sc.calendarios || []
        }));
        
        res.json(transformedData);
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
