const fs = require('fs');
const path = require('path');

const redondeoFilePath = path.join(__dirname, '../local_config/redondeo_options.txt');

const getRedondeo = (req, res) => {
    fs.readFile(redondeoFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer el archivo de redondeo.' });
        }
        if (!data) {
            return res.status(404).json({ error: 'No se han especificado las opciones de redondeo aún.' });
        }
        try {
            const parsed = JSON.parse(data);
            return res.status(200).json(parsed);
        } catch (e) {
            // Si el archivo contiene texto plano, devolverlo en el campo value
            return res.status(200).json({ value: data });
        }
    });
};

const updateRedondeo = (req, res) => {
    const { value, isRedondeoFromPlus } = req.body || {};
    if (typeof value === 'undefined') {
        return res.status(400).json({ error: 'Falta el campo "value" en el body.' });
    }
    const content = {
        value: value,
        isRedondeoFromPlus: typeof isRedondeoFromPlus === 'undefined' ? false : isRedondeoFromPlus
    };
    fs.writeFile(redondeoFilePath, JSON.stringify(content, null, 4), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al escribir en el archivo de redondeo.' });
        }
        res.status(200).json({ message: 'Opciones de redondeo actualizadas correctamente.' });
    });
};

module.exports = {
    getRedondeo,
    updateRedondeo
};
