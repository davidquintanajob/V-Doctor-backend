const comerciableService = require('../services/comerciableService');

const getAllComerciables = async (req, res) => {
    try {
        const comerciables = await comerciableService.getAllComerciables();
        res.status(200).json(comerciables);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getComerciableById = async (req, res) => {
    try {
        const { id } = req.params;
        const comerciable = await comerciableService.getComerciableById(id);
        if (!comerciable) {
            return res.status(404).json({ error: 'Comerciable no encontrado' });
        }
        res.status(200).json(comerciable);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const filterComerciables = async (req, res) => {
    try {
        const { limit, page } = req.params;
        const filterCriteria = req.body;

        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);

        if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
            return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
        }

        const offset = (pageNum - 1) * limitNum;

        const { rows: comerciables, count: total } = await comerciableService.filterComerciablesPaginated(filterCriteria, limitNum, offset);

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            data: comerciables,
            pagination: {
                total,
                currentPage: pageNum,
                limit: limitNum,
                totalPages
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllComerciables,
    getComerciableById,
    filterComerciables
};
