// update-costos-simple.js
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración
const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'adeimy-cambio-costousd',
    user: 'postgres',
    password: 'pg'
});

async function updateCostos() {
    try {
        await client.connect();
        console.log('✅ Conectado a PostgreSQL');

        // Leer y parsear CSV manualmente
        const csvData = fs.readFileSync('data-1781786649607.csv', 'utf8');
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        let actualizados = 0;
        let errores = 0;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
            const id_comerciable = parseInt(values[0]);
            const nombre = values[1];
            const costo_usd = parseFloat(values[2]);

            const query = `
                UPDATE productos 
                SET costo_usd = $1 
                WHERE id_comerciable = $2
            `;

            try {
                const result = await client.query(query, [costo_usd, id_comerciable]);
                if (result.rowCount > 0) {
                    actualizados++;
                    console.log(`✅ ID ${id_comerciable}: ${nombre} -> $${costo_usd}`);
                } else {
                    console.log(`⚠️ ID ${id_comerciable} no encontrado`);
                }
            } catch (err) {
                errores++;
                console.error(`❌ Error con ID ${id_comerciable}:`, err.message);
            }
        }

        console.log(`\n📊 Total actualizados: ${actualizados}`);
        console.log(`❌ Errores: ${errores}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

updateCostos();