const medicamentoService = require('../services/medicamentoService');
const { tiposMedicamento } = require('../models/medicamento');
const { roles } = require('../models/usuario');

const getAllMedicamentos = async (req, res) => {
    try {
        const medicamentos = await medicamentoService.getAllMedicamentos();
        res.status(200).json(medicamentos);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const getMedicamentoById = async (req, res) => {
    try {
        const { id } = req.params;
        const medicamento = await medicamentoService.getMedicamentoById(id);
        if (!medicamento) {
            return res.status(404).json({ error: 'Medicamento no encontrado' });
        }
        res.status(200).json(medicamento);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const createMedicamento = async (req, res) => {
    const { nombre, costo_usd, costo_cup, categoria, codigo, cantidad, precio_usd, precio_cup, tipo_medicamento, unidad_medida, posologia, roles_autorizados } = req.body;
    const errors = [];

    if (!nombre) errors.push("El nombre es requerido");
    if (!costo_usd) errors.push("El costo_usd es requerido");
    if (!costo_cup) errors.push("El costo_cup es requerido");
    if (!categoria) errors.push("La categoria es requerida");
    if (!codigo) errors.push("El codigo es requerido");
    if (!precio_usd) errors.push("El precio_usd es requerido");
    if (!precio_cup) errors.push("El precio_cup es requerido");
    if (!tipo_medicamento) errors.push("El tipo_medicamento es requerido");
    if (!unidad_medida) errors.push("La unidad_medida es requerida");

    if (tipo_medicamento && !tiposMedicamento.includes(tipo_medicamento)) {
        errors.push(`El tipo de medicamento '${tipo_medicamento}' no es válido.`);
    }

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
        const newMedicamento = await medicamentoService.createMedicamento(req.body);
        res.status(201).json(newMedicamento);
    } catch (error) {
        if (error.message.includes("Ya existe un producto con el código")) {
            return res.status(409).json({ error: error.message });
        }
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const updateMedicamento = async (req, res) => {
    const { tipo_medicamento, roles_autorizados } = req.body;
    const errors = [];

    if (tipo_medicamento && !tiposMedicamento.includes(tipo_medicamento)) {
        errors.push(`El tipo de medicamento '${tipo_medicamento}' no es válido.`);
    }

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
        const medicamentoActualizado = await medicamentoService.updateMedicamento(id, req.body);
        if (!medicamentoActualizado) {
            return res.status(404).json({ error: 'Medicamento no encontrado' });
        }
        res.status(200).json(medicamentoActualizado);
    } catch (error) {
        if (error.message.includes("Ya existe un producto con el código")) {
            return res.status(409).json({ error: error.message });
        }
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const deleteMedicamento = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await medicamentoService.deleteMedicamento(id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Medicamento no encontrado' });
        }
        res.status(200).json({ message: 'Medicamento eliminado correctamente' });
    } catch (error) {
        if (error.message.includes("No se puede eliminar el producto")) {
            return res.status(409).json({ error: error.message });
        }
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const filterMedicamentos = async (req, res) => {
    try {
        const { limit, page } = req.params;
        const filterCriteria = req.body;

        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);

        if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
            return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
        }

        const offset = (pageNum - 1) * limitNum;

        const { rows: medicamentos, count: total } = await medicamentoService.filterMedicamentosPaginated(filterCriteria, limitNum, offset);

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            data: medicamentos,
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
    getAllMedicamentos,
    getMedicamentoById,
    createMedicamento,
    updateMedicamento,
    deleteMedicamento,
    filterMedicamentos,
};
