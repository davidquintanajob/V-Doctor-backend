const fotoServicioComplejoService = require('../services/fotoServicioComplejoService');

const getFotoServicioComplejoById = async (req, res) => {
    try {
        const foto = await fotoServicioComplejoService.getFotoServicioComplejoById(req.params.id);
        if (!foto) {
            return res.status(404).json({ errors: ['Foto no encontrada'] });
        }
        res.json(foto);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
};

const createFotoServicioComplejo = async (req, res) => {
    try {
        const newFoto = await fotoServicioComplejoService.createFotoServicioComplejo(req.body);
        res.status(201).json(newFoto);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
};

const updateFotoServicioComplejo = async (req, res) => {
    try {
        const updatedFoto = await fotoServicioComplejoService.updateFotoServicioComplejo(req.params.id, req.body);
        res.json(updatedFoto);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
};

const deleteFotoServicioComplejo = async (req, res) => {
    try {
        await fotoServicioComplejoService.deleteFotoServicioComplejo(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
};

const getFotosByServicioComplejoId = async (req, res) => {
    try {
        const fotos = await fotoServicioComplejoService.getFotosByServicioComplejoId(req.params.id);
        res.json(fotos);
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
};

module.exports = {
    getFotoServicioComplejoById,
    createFotoServicioComplejo,
    updateFotoServicioComplejo,
    deleteFotoServicioComplejo,
    getFotosByServicioComplejoId,
};
