const { FotoServicioComplejo } = require("../models/foto_servicio_complejo");
const { ServicioComplejo } = require("../models/servicio_complejo");
const fs = require('fs').promises;
const path = require('path');
const sequelize = require("../helpers/database");

const getFotoServicioComplejoById = async (id) => {
    return await FotoServicioComplejo.findByPk(id);
};

const createFotoServicioComplejo = async (data) => {
    const t = await sequelize.transaction();
    try {
        const { id_comerciable_servicio_complejo, nota, ruta } = data;

        const servicioComplejo = await ServicioComplejo.findByPk(id_comerciable_servicio_complejo);
        if (!servicioComplejo) {
            throw new Error("Servicio complejo no encontrado");
        }

        const newFoto = await FotoServicioComplejo.create({
            nota,
            ruta: '',
            id_comerciable_servicio_complejo,
        }, { transaction: t });

        const FOTOS_CARPETA_SERVICIO_COMPLEJO = process.env.FOTOS_CARPETA_SERVICIO_COMPLEJO || "/fotos/servicio_complejo/";
        const imagePath = path.join(FOTOS_CARPETA_SERVICIO_COMPLEJO, `${id_comerciable_servicio_complejo}-${newFoto.id_foto_servicio_complejo}`);
        await fs.writeFile(path.join(__dirname, '..', imagePath), ruta, 'base64');
        await newFoto.update({ ruta: imagePath }, { transaction: t });

        await t.commit();
        return newFoto;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

const updateFotoServicioComplejo = async (id, data) => {
    const t = await sequelize.transaction();
    try {
        const { nota, ruta } = data;
        const foto = await FotoServicioComplejo.findByPk(id, { transaction: t });
        if (!foto) {
            throw new Error("Foto no encontrada");
        }

        await foto.update({ nota }, { transaction: t });

        if (ruta) {
            const FOTOS_CARPETA_SERVICIO_COMPLEJO = process.env.FOTOS_CARPETA_SERVICIO_COMPLEJO || "/fotos/servicio_complejo/";
            const imagePath = path.join(FOTOS_CARPETA_SERVICIO_COMPLEJO, `${foto.id_comerciable_servicio_complejo}-${foto.id_foto_servicio_complejo}`);
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

const deleteFotoServicioComplejo = async (id) => {
    const t = await sequelize.transaction();
    try {
        const foto = await FotoServicioComplejo.findByPk(id, { transaction: t });
        if (!foto) {
            throw new Error("Foto no encontrada");
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

const getFotosByServicioComplejoId = async (servicioComplejoId) => {
    return await FotoServicioComplejo.findAll({
        where: { id_comerciable_servicio_complejo: servicioComplejoId }
    });
};

module.exports = {
    getFotoServicioComplejoById,
    createFotoServicioComplejo,
    updateFotoServicioComplejo,
    deleteFotoServicioComplejo,
    getFotosByServicioComplejoId,
};
