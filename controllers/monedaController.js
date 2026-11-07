const fs = require('fs');
const path = require('path');
const { Producto } = require('../models/producto');
const { Comerciable } = require('../models/comerciable');

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

    // Validar que el campo value esté presente
    if (typeof value === 'undefined' || value === null) {
        return res.status(400).json({ error: 'El campo `value` es requerido en el body.' });
    }

    // Escribir el nuevo valor en el archivo (siempre se actualiza)
    try {
        const toWrite = (typeof value === 'string') ? value : String(value);
        await fs.promises.writeFile(monedaFilePath, toWrite, 'utf8');
    } catch (err) {
        return res.status(500).json({ error: 'Error al escribir en el archivo de moneda.' });
    }

    // Determinar si se deben actualizar los precios de los productos
    const shouldChange = config && config.isCambioCostosProductos === true;

    if (shouldChange) {
        // Convertir value a número para los cálculos
        let numericValue;
        if (typeof value === 'number') {
            numericValue = value;
        } else if (typeof value === 'string') {
            const cleaned = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
            numericValue = parseFloat(cleaned);
        } else {
            return res.status(400).json({ error: 'El campo `value` debe ser un número válido cuando `config.isCambioCostosProductos` es true.' });
        }

        if (!Number.isFinite(numericValue) || numericValue <= 0) {
            return res.status(400).json({ error: 'El campo `value` debe ser un número positivo cuando `config.isCambioCostosProductos` es true.' });
        }

        try {
            // Obtener todos los productos (solo los que tienen comerciable asociado)
            const productos = await Producto.findAll({
                include: [{
                    model: Comerciable,
                    required: true
                }]
            });

            // Actualizar precio_cup de cada comerciable que sea producto
            const updates = productos.map(async (prod) => {
                const comerciable = prod.comerciable;
                // Nuevo precio_cup = precio_usd * nuevo valor de la moneda
                const nuevoPrecioCup = comerciable.precio_usd * numericValue;
                // Solo se modifica precio_cup, el resto queda igual
                await comerciable.update({ precio_cup: nuevoPrecioCup });
            });

            await Promise.all(updates);
        } catch (err) {
            return res.status(500).json({ error: 'Error al actualizar precios de los productos.' });
        }
    }

    res.status(200).json({ message: 'Valor de la moneda actualizado correctamente.' });
};

module.exports = {
    getMoneda,
    updateMoneda
};