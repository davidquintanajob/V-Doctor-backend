const fs = require('fs');
const path = require('path');

const LOG_FILE_PATH = path.join(__dirname, '..', 'logs', 'app.log');

function parseDateToMs(dateString) {
  const d = new Date(dateString);
  const time = d.getTime();
  return Number.isNaN(time) ? null : time;
}

function loadLogsFromFile() {
  if (!fs.existsSync(LOG_FILE_PATH)) {
    return [];
  }

  const content = fs.readFileSync(LOG_FILE_PATH, 'utf8');
  if (!content.trim()) {
    return [];
  }

  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

  const logs = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      const tsMs = parseDateToMs(obj.timestamp);
      if (tsMs === null) continue;
      obj._timestampMs = tsMs;
      logs.push(obj);
    } catch (err) {
      // Si una línea no es JSON válido la ignoramos
      continue;
    }
  }

  // Aseguramos orden por timestamp por si acaso
  logs.sort((a, b) => a._timestampMs - b._timestampMs);

  return logs;
}

function findFirstIndexByTime(logs, fromMs) {
  let left = 0;
  let right = logs.length - 1;
  let result = logs.length;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (logs[mid]._timestampMs >= fromMs) {
      result = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return result;
}

function findLastIndexByTime(logs, toMs) {
  let left = 0;
  let right = logs.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (logs[mid]._timestampMs <= toMs) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

async function filterLogsByCriteria({
  fecha_desde,
  fecha_hasta,
  metodo,
  nombre_usuario,
  urls
}) {
  const fromMs = parseDateToMs(fecha_desde);
  const toMs = parseDateToMs(fecha_hasta);

  if (fromMs === null || toMs === null) {
    const error = new Error('fecha_desde y fecha_hasta deben ser fechas válidas en formato ISO');
    error.status = 400;
    throw error;
  }

  if (fromMs > toMs) {
    const error = new Error('fecha_desde no puede ser mayor que fecha_hasta');
    error.status = 400;
    throw error;
  }

  const allLogs = loadLogsFromFile();

  if (allLogs.length === 0) {
    return [];
  }

  const startIndex = findFirstIndexByTime(allLogs, fromMs);
  const endIndex = findLastIndexByTime(allLogs, toMs);

  if (startIndex > endIndex || startIndex >= allLogs.length || endIndex < 0) {
    return [];
  }

  let result = allLogs.slice(startIndex, endIndex + 1);

  const methodUpper = metodo ? String(metodo).toUpperCase() : null;
  const normalizedUrls = Array.isArray(urls) ? urls.filter(u => typeof u === 'string' && u.trim() !== '') : [];

  if (methodUpper) {
    result = result.filter(log => String(log.method).toUpperCase() === methodUpper);
  }

  if (nombre_usuario) {
    result = result.filter(
      log =>
        log.user &&
        typeof log.user.nombre_usuario === 'string' &&
        log.user.nombre_usuario === nombre_usuario
    );
  }

  if (normalizedUrls.length > 0) {
    const setUrls = new Set(normalizedUrls);
    result = result.filter(log => log.url && setUrls.has(log.url));
  }

  // Eliminamos el campo interno antes de devolver
  return result.map(({ _timestampMs, ...rest }) => rest);
}

module.exports = {
  filterLogsByCriteria
};

