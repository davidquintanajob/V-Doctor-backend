const fotoConsultaService = require('../services/fotoConsultaService');

const getFotoConsultaById = async (req, res) => {
  try {
    const foto = await fotoConsultaService.getFotoConsultaById(req.params.id);
    if (!foto) return res.status(404).json({ errors: ['Foto no encontrada'] });
    res.json(foto);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const createFotoConsulta = async (req, res) => {
  try {
    const newFoto = await fotoConsultaService.createFotoConsulta(req.body);
    res.status(201).json(newFoto);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const updateFotoConsulta = async (req, res) => {
  try {
    const updated = await fotoConsultaService.updateFotoConsulta(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const deleteFotoConsulta = async (req, res) => {
  try {
    await fotoConsultaService.deleteFotoConsulta(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

const getFotosByConsultaId = async (req, res) => {
  try {
    const fotos = await fotoConsultaService.getFotosByConsultaId(req.params.id);
    res.json(fotos);
  } catch (error) {
    res.status(500).json({ errors: [error.message] });
  }
};

module.exports = {
  getFotoConsultaById,
  createFotoConsulta,
  updateFotoConsulta,
  deleteFotoConsulta,
  getFotosByConsultaId,
};
