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
    const { value, isRedondeoFromPlus, costoFormula, telefono_contacto } = req.body || {};
    if (typeof value === 'undefined') {
        return res.status(400).json({ error: 'Falta el campo "value" en el body.' });
    }

    if (typeof telefono_contacto !== 'undefined' && telefono_contacto !== null && typeof telefono_contacto !== 'string') {
        return res.status(400).json({ error: 'El campo "telefono_contacto" debe ser texto.' });
    }

    const allowedFormulas = ['Promedio ponderado', 'Primero en entrar, primero en salir'];
    let finalCostoFormula = null;
    if (typeof costoFormula !== 'undefined' && costoFormula !== null) {
        if (typeof costoFormula !== 'string' || !allowedFormulas.includes(costoFormula)) {
            return res.status(400).json({ error: 'El campo "costoFormula" debe ser una de: ' + allowedFormulas.join(', ') });
        }
        finalCostoFormula = costoFormula;
    }

    const content = {
        value: value,
        isRedondeoFromPlus: typeof isRedondeoFromPlus === 'undefined' ? false : isRedondeoFromPlus,
        costoFormula: finalCostoFormula,
        telefono_contacto: typeof telefono_contacto === 'undefined' ? null : telefono_contacto
    };
    fs.writeFile(redondeoFilePath, JSON.stringify(content, null, 4), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al escribir en el archivo de redondeo.' });
        }
        res.status(200).json({ message: 'Opciones de redondeo actualizadas correctamente.' });
    });
};


// Helper to delete existing logo files with any extension
const removeExistingLogos = (dir, callback) => {
    fs.readdir(dir, (err, files) => {
        if (err) return callback();
        
        if (!files || files.length === 0) {
            return callback();
        }

        const logoFiles = files.filter(f => f.startsWith('logo.'));
        if (logoFiles.length === 0) {
            return callback();
        }

        let deletedCount = 0;
        logoFiles.forEach(f => {
            fs.unlink(path.join(dir, f), (unlinkErr) => {
                deletedCount++;
                if (deletedCount === logoFiles.length) {
                    callback();
                }
            });
        });
    });
};

const updateLogo = (req, res) => {
    const { image } = req.body || {};
    if (!image) {
        return res.status(400).json({ error: 'Falta el campo "image" en el body.' });
    }

    // Extraer datos base64 y tipo mime si viene en data URI
    const dataUriMatch = image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    let mimeType = 'image/png';
    let imageData = image;
    if (dataUriMatch) {
        mimeType = dataUriMatch[1];
        imageData = dataUriMatch[2];
    }

    const ext = mimeType.split('/')[1];
    const photosDir = path.join(__dirname, '../fotos');
    const logoPath = path.join(photosDir, `logo.${ext}`);

    // Remove previous logo files first, then write the new one
    removeExistingLogos(photosDir, () => {
        const buffer = Buffer.from(imageData, 'base64');
        fs.writeFile(logoPath, buffer, err => {
            if (err) {
                return res.status(500).json({ error: 'Error al guardar la imagen.' });
            }
            res.status(200).json({ message: 'Logo actualizado correctamente.', filename: `logo.${ext}` });
        });
    });
};

module.exports = {
    getRedondeo,
    updateRedondeo,
    updateLogo
};
