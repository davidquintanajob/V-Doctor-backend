const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: API para consultar logs del sistema
 */

/**
 * @swagger
 * /logsFilter:
 *   post:
 *     summary: Filtrar logs del sistema
 *     description: |
 *       Filtra los registros de `app.log` por un rango de fechas obligatorio y filtros opcionales
 *       como método HTTP, usuario y lista de URLs.  
 *       Los registros se leen del archivo `logs/app.log`, que almacena un JSON por línea.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_desde
 *               - fecha_hasta
 *             properties:
 *               fecha_desde:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha/hora inicial del rango (ISO 8601)
 *               fecha_hasta:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha/hora final del rango (ISO 8601)
 *               metodo:
 *                 type: string
 *                 description: Método HTTP para filtrar (POST, GET, PUT, DELETE)
 *                 enum: [GET, POST, PUT, DELETE]
 *               nombre_usuario:
 *                 type: string
 *                 description: Nombre de usuario (campo `user.nombre_usuario` en el log)
 *               urls:
 *                 type: array
 *                 description: Lista de URLs exactas a filtrar
 *                 items:
 *                   type: string
 *           example:
 *             fecha_desde: "2025-11-28T17:00:00.000Z"
 *             fecha_hasta: "2025-11-28T18:00:00.000Z"
 *             metodo: "POST"
 *             nombre_usuario: "david"
 *             urls:
 *               - "/cliente/CreateClienteWithPatients"
 *               - "/paciente/Filter/5/1"
 *     responses:
 *       200:
 *         description: Lista de logs filtrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Cantidad total de registros devueltos
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: Registro de log tal como está almacenado en el archivo
 *       400:
 *         description: Parámetros de filtro inválidos o faltantes
 *       500:
 *         description: Error interno del servidor al procesar los logs
 */
router.post('/logsFilter', authenticate(), logsController.filterLogs);

module.exports = router;

