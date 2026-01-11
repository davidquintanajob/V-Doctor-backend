const fs = require('fs');
const path = require('path');
const { Producto } = require('../models/producto');

const monedaFilePath = path.join(__dirname, '../local_config/moneda.txt');

const getMoneda = (req, res) => {
    fs.readFile(monedaFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer el archivo de moneda.' });
        }
        if (!data) {
            return res.status(404).json({ error: 'No se ha especificado el valor de la moneda aún.' });
        }
        res.status(200).json({ value: data });
    });
};

const updateMoneda = async (req, res) => {
    const { value, config } = req.body || {};
    if (typeof value === 'undefined' || value === null) {
        return res.status(400).json({ error: 'El campo `value` es requerido en el body.' });
    }

    // Determine si se debe cambiar costos según config
    const shouldChange = config && config.isCambioCostosProductos === true;
    const tipo = config && typeof config.tipo === 'string' ? config.tipo.toLowerCase().trim() : null;

    // Si se solicita cambio de costos, necesitamos un valor numérico válido
    let numericValue = null;
    if (shouldChange) {
        if (typeof value === 'number') {
            numericValue = value;
        } else if (typeof value === 'string') {
            const cleaned = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
            numericValue = parseFloat(cleaned);
        }
        if (!Number.isFinite(numericValue) || numericValue === 0) {
            return res.status(400).json({ error: 'El campo `value` debe contener un número válido cuando `config.isCambioCostosProductos` es true.' });
        }

        if (!tipo || (tipo !== 'cambiar usd' && tipo !== 'cambiar cup')) {
            return res.status(400).json({ error: 'El campo `config.tipo` debe ser "cambiar usd" o "cambiar cup" cuando `config.isCambioCostosProductos` es true.' });
        }
    }

    try {
        const toWrite = (typeof value === 'string') ? value : String(value);
        await fs.promises.writeFile(monedaFilePath, toWrite, 'utf8');
    } catch (err) {
        return res.status(500).json({ error: 'Error al escribir en el archivo de moneda.' });
    }

    if (shouldChange) {
        try {
            const productos = await Producto.findAll();
            const updates = productos.map(prod => {
                const costoUsd = Number(prod.costo_usd) || 0;
                const costoCup = Number(prod.costo_cup) || 0;

                if (tipo === 'cambiar usd') {
                    const nuevoUsd = Math.round((costoCup / numericValue) * 100000) / 100000;
                    return prod.update({ costo_usd: nuevoUsd });
                } else {
                    // cambiar cup
                    const nuevoCup = Math.round((costoUsd * numericValue) * 100000) / 100000;
                    return prod.update({ costo_cup: nuevoCup });
                }
            });
            await Promise.all(updates);
        } catch (err) {
            return res.status(500).json({ error: 'Error al actualizar costos de productos.' });
        }
    }

    res.status(200).json({ message: 'Valor de la moneda actualizado correctamente.' });
};

module.exports = {
    getMoneda,
    updateMoneda
};
