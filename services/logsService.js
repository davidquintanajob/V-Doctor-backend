const fs = require('fs');
const path = require('path');

const LOG_FILE_PATH = path.join(__dirname, '..', 'logs', 'app.log');

function parseDateToMs(dateString) {
  const d = new Date(dateString);
  const time = d.getTime();
  return Number.isNaN(time) ? null : time;
}

async function filterLogsByCriteria({
  fecha_desde,
  fecha_hasta,
  metodo,
  nombre_usuario,
  urls
}) {

  // Parsear fechas
  let fromMs = parseDateToMs(fecha_desde);
  let toMs = parseDateToMs(fecha_hasta);

  if (fromMs === null || toMs === null) {
    throw new Error('fecha_desde y fecha_hasta deben ser fechas válidas');
  }

  // Ajustar fechas para cubrir todo el día si vienen en formato YYYY-MM-DD
  if (fecha_desde.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(fecha_desde)) {
    fromMs = new Date(`${fecha_desde}T00:00:00.000Z`).getTime();
  }
  
  if (fecha_hasta.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(fecha_hasta)) {
    toMs = new Date(`${fecha_hasta}T23:59:59.999Z`).getTime();
  }


  if (fromMs > toMs) {
    throw new Error('fecha_desde no puede ser mayor que fecha_hasta');
  }

  
  if (!fs.existsSync(LOG_FILE_PATH)) {
    return [];
  }

  const content = fs.readFileSync(LOG_FILE_PATH, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  // Parsear todos los logs y filtrar por fecha
  const allLogs = [];
  for (const line of lines) {
    try {
      const log = JSON.parse(line);
      const logTime = parseDateToMs(log.timestamp);
      
      if (logTime === null) continue;
      
      // Filtrar por fecha primero
      if (logTime >= fromMs && logTime <= toMs) {
        // Aplicar filtros adicionales
        let include = true;
        
        // Filtro por método
        if (metodo && log.method !== metodo) {
          include = false;
        }
        
        // Filtro por nombre_usuario - IMPORTANTE: comparación exacta
        if (include && nombre_usuario) {
          const userName = log.user?.nombre_usuario;
          if (userName !== nombre_usuario) {
            include = false;
          }
        }
        
        // Filtro por URLs
        if (include && urls && urls.length > 0) {
          if (!log.url || !urls.includes(log.url)) {
            include = false;
          }
        }
        
        if (include) {
          allLogs.push(log);
        }
      }
    } catch (err) {
      continue;
    }
  }

  return {
    total: allLogs.length,
    data: allLogs
  };
}

module.exports = {
  filterLogsByCriteria
};