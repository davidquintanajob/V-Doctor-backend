const { FotoConsulta } = require('../models/foto_consulta');
const { Consulta } = require('../models/consulta');
const fs = require('fs').promises;
const path = require('path');
const sequelize = require('../helpers/database');

const getFotoConsultaById = async (id) => {
  return await FotoConsulta.findByPk(id);
};

const createFotoConsulta = async (data) => {
  const t = await sequelize.transaction();
  try {
    const { id_consulta, nota, ruta } = data;

    const consulta = await Consulta.findByPk(id_consulta);
    if (!consulta) {
      throw new Error('Consulta no encontrada');
    }

    const newFoto = await FotoConsulta.create({
      nota,
      ruta: '',
      id_consulta,
    }, { transaction: t });

    const FOTOS_CARPETA_CONSULTA = process.env.FOTOS_CARPETA_CONSULTA || '/fotos/consulta';
    const imagePath = path.join(FOTOS_CARPETA_CONSULTA, `${id_consulta}-${newFoto.id_foto_consulta}`);
    await fs.writeFile(path.join(__dirname, '..', imagePath), ruta, 'base64');
    await newFoto.update({ ruta: imagePath }, { transaction: t });

    await t.commit();
    return newFoto;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const updateFotoConsulta = async (id, data) => {
  const t = await sequelize.transaction();
  try {
    const { nota, ruta } = data;
    const foto = await FotoConsulta.findByPk(id, { transaction: t });
    if (!foto) {
      throw new Error('Foto no encontrada');
    }

    await foto.update({ nota }, { transaction: t });

    if (ruta) {
      const FOTOS_CARPETA_CONSULTA = process.env.FOTOS_CARPETA_CONSULTA || '/fotos/consulta';
      const imagePath = path.join(FOTOS_CARPETA_CONSULTA, `${foto.id_consulta}-${foto.id_foto_consulta}`);
      await fs.writeFile(path.join(__dirname, '..', imagePath), ruta, 'base64');
      await foto.update({ ruta: imagePath }, { transaction: t });
    }

    await t.commit();
    return foto;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const deleteFotoConsulta = async (id) => {
  const t = await sequelize.transaction();
  try {
    const foto = await FotoConsulta.findByPk(id, { transaction: t });
    if (!foto) {
      throw new Error('Foto no encontrada');
    }

    if (foto.ruta) {
      try {
        await fs.unlink(path.join(__dirname, '..', foto.ruta));
      } catch (err) {
        console.error(`Failed to delete file: ${foto.ruta}`, err);
      }
    }

    await foto.destroy({ transaction: t });
    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const getFotosByConsultaId = async (consultaId) => {
  return await FotoConsulta.findAll({ where: { id_consulta: consultaId } });
};

module.exports = {
  getFotoConsultaById,
  createFotoConsulta,
  updateFotoConsulta,
  deleteFotoConsulta,
  getFotosByConsultaId,
};
