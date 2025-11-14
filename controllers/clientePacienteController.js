const clientePacienteService = require('../services/clientePacienteService');

const getAll = async (req, res) => {
  try {
    const rows = await clientePacienteService.getAll();
    res.status(200).json(rows);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const getByIds = async (req, res) => {
  try {
    const { id_cliente, id_paciente } = req.params;
    const idCli = parseInt(id_cliente, 10);
    const idPac = parseInt(id_paciente, 10);
    if (isNaN(idCli) || isNaN(idPac)) return res.status(400).json({ errors: ['id_cliente e id_paciente deben ser números'] });
    const rel = await clientePacienteService.getByIds(idCli, idPac);
    if (!rel) return res.status(404).json({ error: 'Relación no encontrada' });
    res.status(200).json(rel);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.errors });
  }
};

const create = async (req, res) => {
  try {
    const { id_cliente, id_paciente } = req.body || {};
    const errors = [];
    if (!id_cliente) errors.push('id_cliente es requerido');
    if (!id_paciente) errors.push('id_paciente es requerido');
    const idCli = parseInt(id_cliente, 10);
    const idPac = parseInt(id_paciente, 10);
    if (isNaN(idCli)) errors.push('id_cliente debe ser numérico');
    if (isNaN(idPac)) errors.push('id_paciente debe ser numérico');
    if (errors.length) return res.status(400).json({ errors });

    const created = await clientePacienteService.createRelation({ id_cliente: idCli, id_paciente: idPac });
    res.status(201).json(created);
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear relación'];
    res.status(status).json({ errors: errs });
  }
};

const update = async (req, res) => {
  try {
    const { id_cliente, id_paciente } = req.params;
    const { id_cliente: newClienteId, id_paciente: newPacienteId } = req.body || {};
    const idCli = parseInt(id_cliente, 10);
    const idPac = parseInt(id_paciente, 10);
    const newCli = parseInt(newClienteId, 10);
    const newPac = parseInt(newPacienteId, 10);
    const errors = [];
    if (isNaN(idCli) || isNaN(idPac)) errors.push('id_cliente e id_paciente de params deben ser numéricos');
    if (isNaN(newCli) || isNaN(newPac)) errors.push('id_cliente e id_paciente en body deben ser numéricos');
    if (errors.length) return res.status(400).json({ errors });

    const updated = await clientePacienteService.updateRelation(idCli, idPac, { id_cliente: newCli, id_paciente: newPac });
    if (!updated) return res.status(404).json({ error: 'Relación original no encontrada' });
    res.status(200).json(updated);
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al actualizar relación'];
    res.status(status).json({ errors: errs });
  }
};

const remove = async (req, res) => {
  try {
    const { id_cliente, id_paciente } = req.params;
    const idCli = parseInt(id_cliente, 10);
    const idPac = parseInt(id_paciente, 10);
    if (isNaN(idCli) || isNaN(idPac)) return res.status(400).json({ errors: ['id_cliente e id_paciente deben ser números'] });
    const deleted = await clientePacienteService.deleteRelation(idCli, idPac);
    if (!deleted) return res.status(404).json({ error: 'Relación no encontrada' });
    res.status(200).json({ message: 'Relación eliminada correctamente' });
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al eliminar relación'];
    res.status(status).json({ errors: errs });
  }
};

const clientsByPatient = async (req, res) => {
  try {
    const { id_paciente } = req.params;
    const idPac = parseInt(id_paciente, 10);
    if (isNaN(idPac)) return res.status(400).json({ errors: ['id_paciente debe ser numérico'] });
    const clientes = await clientePacienteService.getClientsByPatientId(idPac);
    res.status(200).json(clientes);
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al obtener clientes por paciente'];
    res.status(status).json({ errors: errs });
  }
};

const patientsByClient = async (req, res) => {
  try {
    const { id_cliente } = req.params;
    const idCli = parseInt(id_cliente, 10);
    if (isNaN(idCli)) return res.status(400).json({ errors: ['id_cliente debe ser numérico'] });
    const pacientes = await clientePacienteService.getPatientsByClientId(idCli);
    res.status(200).json(pacientes);
  } catch (error) {
    const status = error.status || 500;
    const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al obtener pacientes por cliente'];
    res.status(status).json({ errors: errs });
  }
};

module.exports = {
  getAll,
  getByIds,
  create,
  update,
  remove,
  clientsByPatient,
  patientsByClient
};
