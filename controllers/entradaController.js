const entradaService = require('../services/entradaService');

const getEntradaById = async (req, res) => {
    try {
        const { id } = req.params;
        const entrada = await entradaService.getEntradaById(id);
        if (!entrada) {
            return res.status(404).json({ error: 'Entrada no encontrada' });
        }
        res.status(200).json(entrada);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const createEntrada = async (req, res) => {
    const { fecha, cantidad, costo_cup, costo_usd, id_usuario, id_comerciable } = req.body;
    const errors = [];

    if (!fecha) errors.push("La fecha es requerida");
    if (!cantidad) errors.push("La cantidad es requerida");
    if (costo_cup === null || costo_cup === undefined)
        errors.push("El costo en cup es requerido");

    if (costo_usd === null || costo_usd === undefined)
        errors.push("El costo en usd es requerido");
    if (!id_comerciable) errors.push("El producto o medicmaneto es requerido");
    if (!id_usuario) errors.push("El usuario es requerido");

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const newEntrada = await entradaService.createEntrada(req.body);
        res.status(201).json(newEntrada);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const updateEntrada = async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, cantidad, costo_cup, costo_usd, id_usuario, id_comerciable, nombre_proveedor } = req.body;
        const errors = [];

        // Validaciones opcionales: solo validar si se proporcionan en la solicitud
        if (cantidad !== undefined && !cantidad) {
            errors.push("La cantidad debe ser mayor a 0");
        }
        if (costo_cup !== undefined && (costo_cup === null || costo_cup === undefined)) {
            errors.push("El costo en CUP es inválido");
        }
        if (costo_usd !== undefined && (costo_usd === null || costo_usd === undefined)) {
            errors.push("El costo en USD es inválido");
        }
        if (id_comerciable !== undefined && !id_comerciable) {
            errors.push("El producto o medicamento es inválido");
        }
        if (id_usuario !== undefined && !id_usuario) {
            errors.push("El usuario es inválido");
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const entradaActualizada = await entradaService.updateEntrada(id, req.body);
        if (!entradaActualizada) {
            return res.status(404).json({ error: 'Entrada no encontrada' });
        }
        res.status(200).json(entradaActualizada);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const deleteEntrada = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await entradaService.deleteEntrada(id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Entrada no encontrada' });
        }
        res.status(200).json({ message: 'Entrada eliminada correctamente' });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const filterEntradas = async (req, res) => {
    try {
        const { limit, page } = req.params;
        const filterCriteria = req.body;

        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);

        if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
            return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
        }

        const offset = (pageNum - 1) * limitNum;

        const {
            rows: entradas,
            count: total,
            totalCantidad,
            totalCostoCup,
            totalCostoUsd
        } = await entradaService.filterEntradasPaginated(filterCriteria, limitNum, offset);

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            data: entradas,
            pagination: {
                total,
                currentPage: pageNum,
                limit: limitNum,
                totalPages,
                totalCantidad: parseFloat(totalCantidad.toFixed(2)),
                totalCostoCup: parseFloat(totalCostoCup.toFixed(2)),
                totalCostoUsd: parseFloat(totalCostoUsd.toFixed(2))
            }
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const getAllEntradas = async (req, res) => {
    try {
        const entradas = await entradaService.getAllEntradas();
        res.status(200).json(entradas);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const getEntradasByComerciable = async (req, res) => {
    try {
        const id = req.params.id_comerciable;
        const entradas = await entradaService.getEntradasByComerciable(id);
        res.status(200).json(entradas);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

module.exports = {
    getEntradaById,
    createEntrada,
    updateEntrada,
    deleteEntrada,
    filterEntradas,
    getAllEntradas,
    getEntradasByComerciable,
};
