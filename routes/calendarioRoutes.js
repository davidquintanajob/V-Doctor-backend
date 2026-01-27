const express = require('express');
const router = express.Router();
const calendarioController = require('../controllers/calendarioController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: Calendario
 *   description: Gestión de eventos del calendario
 */

/**
 * @swagger
 * /calendario:
 *   get:
 *     summary: Obtener todos los eventos del calendario
 *     tags: [Calendario]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de eventos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/calendario', authenticate(), calendarioController.getAllCalendarios);

/**
 * @swagger
 * /calendario/{id}:
 *   get:
 *     summary: Obtener un evento por ID
 *     tags: [Calendario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del evento
 *     responses:
 *       200:
 *         description: Evento encontrado
 *       404:
 *         description: Evento no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/calendario/:id', authenticate(), calendarioController.getCalendarioById);

/**
 * @swagger
 * /calendario/Create:
 *   post:
 *     summary: Crear un nuevo evento de calendario
 *     tags: [Calendario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *               - descripcion
 *               - id_usuario
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               descripcion:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *               id_comerciable_servicio_complejo:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Evento creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/calendario/Create', authenticate(), calendarioController.createCalendario);

/**
 * @swagger
 * /calendario/Update/{id}:
 *   put:
 *     summary: Actualizar un evento de calendario
 *     tags: [Calendario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del evento a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *               - descripcion
 *               - id_usuario
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               descripcion:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *               id_comerciable_servicio_complejo:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Evento actualizado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Evento no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/calendario/Update/:id', authenticate(), calendarioController.updateCalendario);

/**
 * @swagger
 * /calendario/Delete/{id}:
 *   delete:
 *     summary: Eliminar un evento de calendario
 *     tags: [Calendario]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del evento a eliminar
 *     responses:
 *       200:
 *         description: Evento eliminado
 *       404:
 *         description: Evento no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/calendario/Delete/:id', authenticate(), calendarioController.deleteCalendario);

/**
 * @swagger
 * /calendario/filter:
 *   post:
 *     summary: Filtrar eventos del calendario
 *     tags: [Calendario]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_usuario:
 *                 type: string
 *               nombre_paciente:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *               descripcion:
 *                 type: string
 *               fecha_inicio:
 *                 type: string
 *                 format: date-time
 *               fecha_fin:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Resultados del filtrado (incluye Usuario y Paciente relacionados)
 *       400:
 *         description: Filtro inválido
 *       500:
 *         description: Error interno del servidor
 */
router.post('/calendario/filter', authenticate(), calendarioController.filterCalendarios);

module.exports = router;
