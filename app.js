/* global process */
const express = require("express");
const cors = require('cors');
const logger = require("./helpers/logger.js");
const sequelize = require("./helpers/database.js");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require('dotenv').config();
const jwt = require("jsonwebtoken");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_OPTIONS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logger de solicitudes mejorado
app.use((req, res, next) => {
  const startTime = Date.now();
  const userInfo = extractUserInfo(req); // ¡Cambiado a la nueva función!
  
  const isLoginEndpoint = (req.originalUrl || req.url).includes('/Usuario/login');
  
  // Interceptamos la respuesta para capturar el status code
  const originalSend = res.send;
  res.send = function(body) {
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
      schemas: {},
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

// Importar rutas
const usuarioRoutes = require("./routes/usuarioRouts");

// Montar rutas
app.use("/", usuarioRoutes);

// Importar modelos en ORDEN CORRECTO (modelos base primero)
const Usuario = require("./models/usuario.js");

// Verificación de modelos cargados (DEBUG)
console.log("Modelos registrados en Sequelize:", Object.keys(sequelize.models));

// Configurar relaciones después de cargar todos los modelos
function setupRelations() {
  try {
    // Asegurarnos de que todos los modelos estén disponibles
    const models = {
      Usuario,
    };
    
    // 1. Modelos sin dependencias externas

    // 2. Modelos que solo dependen de los básicos
    Usuario.associate(models);
    
    // 3. Modelos con dependencias más complejas
    
    // 4. Modelos de unión/intermediarios

    
  } catch (error) {
    console.error("❌ Error al establecer relaciones:", error);
    throw error;
  }
}

// Iniciar servidor y sincronizar BD
const startApp = async () => {
  try {
    // Establecer relaciones antes de sincronizar
    setupRelations();

    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true }); // O { force: true } si quieres recrear las tablas en cada inicio
    console.log("✅ Tablas sincronizadas correctamente");

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("❌ Error crítico al iniciar la aplicación:", error);
    process.exit(1); // Termina el proceso con código de error
  }
};

// Manejo de cierre limpio
process.on('SIGINT', async () => {
  await sequelize.close();
  process.exit(0);
});

startApp();

module.exports = app;