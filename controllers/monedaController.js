const fs = require('fs');
const path = require('path');

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

const updateMoneda = (req, res) => {
    const { value } = req.body || {};
    if (typeof value === 'undefined' || value === null) {
        return res.status(400).json({ error: 'El campo `value` es requerido en el body.' });
    }
    fs.writeFile(monedaFilePath, value, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al escribir en el archivo de moneda.' });
        }
        res.status(200).json({ message: 'Valor de la moneda actualizado correctamente.' });
    });
};

module.exports = {
    getMoneda,
    updateMoneda
};
