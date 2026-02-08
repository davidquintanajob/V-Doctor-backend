/* global process */
const express = require("express");
const cors = require('cors');
const logger = require("./helpers/logger.js");
const sequelize = require("./helpers/database.js");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');

// License manager
const { SecureLicenseManager } = require('./helpers/SecureLicenseManager');
const http = require('http');
const WebSocket = require('ws');

const app = express();

// ✅ AGREGAR ESTO: Configurar límite de tamaño para JSON (ej: 50MB)
app.use(express.json({ limit: '50mb' }));

// ✅ TAMBIÉN AGREGAR ESTO: Para datos de formularios si los usas
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_OPTIONS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ SERVIR ARCHIVOS ESTÁTICOS
app.use('/fotos', express.static(path.join(__dirname, 'fotos')));

// Logger de solicitudes mejorado
app.use((req, res, next) => {
  const startTime = Date.now();
  const userInfo = extractUserInfo(req); // ¡Cambiado a la nueva función!

  const isLoginEndpoint = (req.originalUrl || req.url).includes('/Usuario/login');

  // Interceptamos la respuesta para capturar el status code
  const originalSend = res.send;
  res.send = function (body) {
    const responseTime = Date.now() - startTime;

    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      user: userInfo,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Log para endpoint de login
    if (isLoginEndpoint) {
      logger.info({
        message: `🔐 LOGIN: ${req.method} ${req.url}`,
        ...logData,
        logType: 'LOGIN'
      });
    } else {
      // Log normal para otros endpoints
      logger.info({
        message: `Solicitud recibida: ${req.method} ${req.url}`,
        ...logData,
        logType: 'NORMAL'
      });
    }

    // Log simplificado en consola
    const userDisplay = userInfo.nombre_usuario || 'No autenticado';
    const logLevel = isLoginEndpoint ? 'LOGIN' : 'INFO';
    console.log(`${new Date().toISOString()} - ${res.statusCode} - ${req.method} ${req.url} - User: ${userDisplay} - Level: ${logLevel}`);

    return originalSend.call(this, body);
  };

  next();
});
// Función para extraer información del usuario según el tipo de endpoint
function extractUserInfo(req) {
  const isLoginEndpoint = (req.originalUrl || req.url).includes('/Usuario/login');

  // Para endpoints de login, extraer información del body
  if (isLoginEndpoint && req.method === 'POST') {
    return extractUserInfoFromBody(req);
  }

  // Para otros endpoints, extraer información del token
  return extractUserInfoFromToken(req);
}
// Función para extraer información del body en login
function extractUserInfoFromBody(req) {
  try {
    const { nombre_usuario, contrasenna } = req.body || {};

    return {
      userId: null,
      nombre_usuario: nombre_usuario || 'No proporcionado',
      rol: null,
      contrasenna: contrasenna ? '*'.repeat(contrasenna.length) : 'No proporcionada',
      source: 'body'
    };

  } catch (error) {
    return {
      userId: null,
      nombre_usuario: null,
      rol: null,
      contrasenna: null,
      error: error,
      source: 'body'
    };
  }
}
// Función original para extraer información del token (sin cambios)
function extractUserInfoFromToken(req) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        userId: null,
        nombre_usuario: null,
        rol: null,
        error: 'No token provided',
        source: 'token'
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return {
      userId: decoded.userId,
      nombre_usuario: decoded.nombre_usuario,
      rol: decoded.rol,
      tokenValid: true,
      source: 'token'
    };

  } catch (error) {
    return {
      userId: null,
      nombre_usuario: null,
      rol: null,
      error: 'Invalid token',
      tokenError: error.message,
      source: 'token'
    };
  }
}

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gestión de Cínica Veterinaria",
      version: "1.0.0",
      description: "Documentación de la API para clínica veterinaria",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Cliente: {
          type: 'object',
          properties: {
            id_cliente: { type: 'integer' },
            nombre: { type: 'string' },
            telefono: { type: 'string' },
            color: { type: 'string' },
            direccion: { type: 'string' }
          }
        },
        Paciente: {
          type: 'object',
          properties: {
            id_paciente: { type: 'integer' },
            nombre: { type: 'string' },
            sexo: { type: 'string' },
            raza: { type: 'string' },
            especie: { type: 'string' },
            numero_clinico: { type: 'integer' },
            fecha_nacimiento: { type: 'string', format: 'date' },
            foto_ruta: { type: 'string' }
          }
        }
      },
    },
    security: [{
      bearerAuth: []
    }],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  swaggerOptions: {
    docExpansion: 'none', // Colapsar secciones por defecto
    defaultModelsExpandDepth: -1, // No expandir la sección Models
    defaultModelExpandDepth: -1,  // No expandir modelos individuales
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
    persistAuthorization: true
  }
}));

// Middleware global para verificar la licencia en cada request
function licenseMiddleware(req, res, next) {
  try {
    const status = SecureLicenseManager.checkLicense();
    if (!status || !status.isValid) {
      logger.error({ message: 'Acceso denegado por licencia', url: req.url, licenseMessage: status ? status.message : 'Licencia inválida' });
      return res.status(403).json({ error: status ? status.message : 'Licencia inválida o no encontrada.' });
    }

    // Actualizar último acceso en la licencia (touch)
    const info = SecureLicenseManager.getLicenseInfo();
    if (info) {
      info.lastAccess = new Date().toISOString();
      // saveLicense es un método estático en la clase
      SecureLicenseManager.saveLicense(info);
    }

    return next();
  } catch (error) {
    console.error('Error en middleware de licencia:', error);
    return res.status(500).json({ error: 'Error interno verificando licencia.' });
  }
}

// Registrar el middleware ANTES de las rutas para proteger los endpoints
app.use(licenseMiddleware);

// Importar modelos en ORDEN CORRECTO (modelos base primero)
const { Usuario } = require("./models/usuario.js");
const { Cliente } = require("./models/cliente.js");
const { Paciente } = require("./models/paciente.js");
const { Comerciable } = require("./models/comerciable.js");
const { Tarea } = require("./models/tarea.js");

// Modelos que dependen de los básicos
const { Entrada } = require("./models/entrada.js");
const { HistorialPeso } = require("./models/historial_peso.js");
const { Consulta } = require("./models/consulta.js");
const { Producto } = require("./models/producto.js");
const { Servicio } = require("./models/servicio.js");
const { Medicamento } = require("./models/medicamento.js");
const { HistorialTarea } = require("./models/historial_tarea.js");
const { ServicioComplejo } = require("./models/servicio_complejo.js");
const { Calendario } = require("./models/calendario.js");

// Modelos con dependencias más complejas
const { FotoConsulta } = require("./models/foto_consulta.js");
const { Venta } = require("./models/venta.js");
const { FotoServicioComplejo } = require("./models/foto_servicio_complejo.js");

// Modelos de unión
const { VentaUsuario } = require("./models/venta_usuario.js");
const { ClientePaciente } = require("./models/cliente_paciente.js");


// Verificación de modelos cargados (DEBUG)
console.log("Modelos registrados en Sequelize:", Object.keys(sequelize.models));

// Importar rutas
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const calendarioRoutes = require('./routes/calendarioRoutes');

// Configurar relaciones después de cargar todos los modelos
function setupRelations() {
  try {
    // Asegurarnos de que todos los modelos estén disponibles
    const models = {
      Usuario,
      Cliente,
      Paciente,
      Comerciable,
      Tarea,
      Entrada,
      HistorialPeso,
      Consulta,
      Producto,
      Servicio,
      Medicamento,
      HistorialTarea,
      ServicioComplejo,
      FotoConsulta,
      Venta,
      FotoServicioComplejo,
      VentaUsuario,
      Calendario, // se pone al final porque depende de ServicioComplejo
    };


    // Iterar sobre los modelos y llamar a associate si existe
    for (const modelName of Object.keys(models)) {
      if (models[modelName] && models[modelName].associate) {
        models[modelName].associate(models);
      }
    }

  } catch (error) {
    console.error("❌ Error al establecer relaciones:", error);
    throw error;
  }
}

// Configurar rutas
const monedaRoutes = require('./routes/monedaRoutes');
const redondeoRoutes = require('./routes/redondeoRoutes');
const comerciableRoutes = require('./routes/comerciableRoutes');
const productoRoutes = require('./routes/productoRoutes');
const medicamentoRoutes = require('./routes/medicamentoRoutes');
const entradaRoutes = require('./routes/entradaRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const servicioComplejoRoutes = require('./routes/servicioComplejoRoutes');
const fotoServicioComplejoRoutes = require('./routes/fotoServicioComplejoRoutes');
const fotoConsultaRoutes = require('./routes/fotoConsultaRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const clientePacienteRoutes = require('./routes/clientePacienteRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const consultaRoutes = require('./routes/consultaRoutes');
const speechToTextRoutes = require('./routes/speechToTextRoutes');
const historialPesoRoutes = require('./routes/historialPesoRoutes');
app.use('/', usuarioRoutes);
app.use('/', clienteRoutes);
app.use('/', calendarioRoutes);
app.use('/', pacienteRoutes);
app.use('/', consultaRoutes);
app.use('/', clientePacienteRoutes);
app.use('/', monedaRoutes);
app.use('/', redondeoRoutes);
app.use('/', comerciableRoutes);
app.use('/', productoRoutes);
app.use('/', medicamentoRoutes);
app.use('/', entradaRoutes);
app.use('/', servicioRoutes);
app.use('/', servicioComplejoRoutes);
app.use('/', fotoServicioComplejoRoutes);
app.use('/', fotoConsultaRoutes);
app.use('/', ventaRoutes);
app.use('/', speechToTextRoutes);
app.use('/', historialPesoRoutes);

const server = http.createServer(app);

// Reemplaza la función startApp() existente con este código:
const startApp = async () => {
  try {
    // Crear directorio y archivo para cambio de moneda
    const monedaDir = path.join(__dirname, 'local_config');
    if (!fs.existsSync(monedaDir)) {
      fs.mkdirSync(monedaDir);
    }
    const monedaFile = path.join(monedaDir, 'moneda.txt');
    if (!fs.existsSync(monedaFile)) {
      fs.writeFileSync(monedaFile, '');
    }
    const redondeoFile = path.join(monedaDir, 'redondeo_options.txt');
    if (!fs.existsSync(redondeoFile)) {
      fs.writeFileSync(redondeoFile, '');
    }

    // Crear carpetas para fotos si no existen
    const fotosDir = path.join(__dirname, 'fotos');
    if (!fs.existsSync(fotosDir)) {
      fs.mkdirSync(fotosDir);
    }

    const subcarpetas = ['servicio_complejo', 'paciente', 'consulta'];
    subcarpetas.forEach(subcarpeta => {
      const subcarpetaDir = path.join(fotosDir, subcarpeta);
      if (!fs.existsSync(subcarpetaDir)) {
        fs.mkdirSync(subcarpetaDir);
      }
    });

    // Establecer relaciones antes de sincronizar
    setupRelations();

    // Sincronizar modelos con la base de datos en orden de dependencia
    // Usar `alter: true` para aplicar cambios no destructivos en el esquema del modelo
    await Usuario.sync({ alter: true });
    await Cliente.sync({ alter: true });
    await Paciente.sync({ alter: true });
    await Comerciable.sync();
    await Tarea.sync();
    await HistorialPeso.sync();
    await Consulta.sync({ alter: true });
    await Producto.sync({ alter: true });
    await Entrada.sync();
    await Servicio.sync();
    await Medicamento.sync();
    await HistorialTarea.sync();
    await ServicioComplejo.sync();
    await ClientePaciente.sync();
    await Calendario.sync();
    await Venta.sync({ alter: false });
    await FotoServicioComplejo.sync();
    await FotoConsulta.sync();
    await VentaUsuario.sync();

    console.log("✅ Tablas sincronizadas correctamente");

    const PORT = process.env.PORT || 4000;
    // ✅ CORRECCIÓN: Usa el SERVER que ya tiene WebSocket, no app.listen()
    // Y escucha en TODAS las interfaces de red (0.0.0.0)
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
      /*
      try {
        const licenseInfo = SecureLicenseManager.getLicenseInfo();
        let daysLeft = null;

        if (licenseInfo) {
          const numericKeys = ['daysLeft','daysRemaining','remainingDays','dias_restantes','diasRestantes'];
          for (const k of numericKeys) {
            if (licenseInfo[k] != null && !isNaN(Number(licenseInfo[k]))) {
              daysLeft = Math.floor(Number(licenseInfo[k]));
              break;
            }
          }

          if (daysLeft === null) {
            const dateKeys = ['expiryDate','expirationDate','expiresAt','validUntil','valid_through','fecha_expiracion','vencimiento','expiration','expiry','endDate','end_date'];
            let dateStr = null;
            for (const k of dateKeys) {
              if (licenseInfo[k]) {
                dateStr = licenseInfo[k];
                break;
              }
            }

            if (!dateStr && licenseInfo.license && (licenseInfo.license.expiresAt || licenseInfo.license.expirationDate)) {
              dateStr = licenseInfo.license.expiresAt || licenseInfo.license.expirationDate;
            }

            if (dateStr) {
              const exp = new Date(dateStr);
              if (!isNaN(exp)) {
                const now = new Date();
                const diff = exp.getTime() - now.getTime();
                daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
              }
            }
          }
        }

        if (daysLeft != null) {
          if (daysLeft >= 0) {
            console.log(`🔒 Licencia: quedan ${daysLeft} día(s)`);
          } else {
            console.log(`🔒 Licencia: expirada hace ${Math.abs(daysLeft)} día(s)`);
          }
        } else {
          console.log('🔒 Licencia: información de expiración no disponible.');
        }
      } catch (err) {
        console.error('Error al obtener info de licencia al iniciar:', err);
      }
        */
    });
  } catch (error) {
    console.error("❌ Error crítico al iniciar la aplicación:", error);
    process.exit(1);
  }
};

// Manejo de cierre limpio
process.on('SIGINT', async () => {
  await sequelize.close();
  process.exit(0);
});

startApp();

module.exports = app;
