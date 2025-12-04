const { FotoServicioComplejo } = require("../models/foto_servicio_complejo");
const { Venta } = require('../models/venta');
const fs = require('fs').promises;
const path = require('path');
const sequelize = require("../helpers/database");

const getFotoServicioComplejoById = async (id) => {
    return await FotoServicioComplejo.findByPk(id);
};

const createFotoServicioComplejo = async (data) => {
    const t = await sequelize.transaction();
    try {
        const { id_venta, nota, imagen } = data;

        const venta = await Venta.findByPk(id_venta, { transaction: t });
        if (!venta) {
            throw new Error("Venta no encontrada");
        }

        const newFoto = await FotoServicioComplejo.create({
            nota,
            ruta: '',
            id_venta,
        }, { transaction: t });

        const FOTOS_CARPETA_SERVICIO_COMPLEJO = process.env.FOTOS_CARPETA_SERVICIO_COMPLEJO || "fotos/servicio_complejo";
        const dirPath = path.join(__dirname, '..', FOTOS_CARPETA_SERVICIO_COMPLEJO);
        await fs.mkdir(dirPath, { recursive: true });

        const fileName = `${venta.id_comerciable}_${newFoto.id_foto_servicio_complejo}.jpg`;
        const imagePath = path.join(FOTOS_CARPETA_SERVICIO_COMPLEJO, fileName);
        await fs.writeFile(path.join(__dirname, '..', imagePath), Buffer.from(imagen, 'base64'));
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
        const { nota, imagen } = data;
        const foto = await FotoServicioComplejo.findByPk(id, { transaction: t });
        if (!foto) {
            throw new Error("Foto no encontrada");
        }

        await foto.update({ nota }, { transaction: t });

        if (imagen) {
            const venta = await Venta.findByPk(foto.id_venta, { transaction: t });
            const FOTOS_CARPETA_SERVICIO_COMPLEJO = process.env.FOTOS_CARPETA_SERVICIO_COMPLEJO || "fotos/servicio_complejo";
            const dirPath = path.join(__dirname, '..', FOTOS_CARPETA_SERVICIO_COMPLEJO);
            await fs.mkdir(dirPath, { recursive: true });

            const fileName = `${venta.id_comerciable}_${foto.id_foto_servicio_complejo}.jpg`;
            const imagePath = path.join(FOTOS_CARPETA_SERVICIO_COMPLEJO, fileName);
            await fs.writeFile(path.join(__dirname, '..', imagePath), Buffer.from(imagen, 'base64'));
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

const getFotosByVentaId = async (ventaId) => {
    return await FotoServicioComplejo.findAll({
        where: { id_venta: ventaId }
    });
};

const getFotosByServicioId = async (servicioId) => {
    const ventas = await Venta.findAll({ where: { id_servicio_complejo: servicioId } });
    const allFotos = [];
    for (const venta of ventas) {
        const fotos = await FotoServicioComplejo.findAll({ where: { id_venta: venta.id_venta } });
        // attach id_venta to each foto for reference
        fotos.forEach(f => { f.dataValues.id_venta = venta.id_venta; allFotos.push(f); });
    }
    return allFotos;
};

module.exports = {
    getFotoServicioComplejoById,
    createFotoServicioComplejo,
    updateFotoServicioComplejo,
    deleteFotoServicioComplejo,
    getFotosByVentaId,
    getFotosByServicioId,
};
