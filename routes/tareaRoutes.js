const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: Tareas
 *   description: API para gestionar tareas
 */

/**
 * @swagger
 * /tarea:
 *   get:
 *     summary: Obtener todas las tareas
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las tareas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_tarea:
 *                     type: integer
 *                   titulo:
 *                     type: string
 *                   descripcion:
 *                     type: string
 *                   fecha_creacion:
 *                     type: string
 *                     format: date-time
 *                   estado:
 *                     type: string
 *                   id_usuario:
 *                     type: integer
 *       500:
 *         description: Error interno del servidor
 */
router.get('/tarea', authenticate(), tareaController.getAllTareas);

/**
 * @swagger
 * /tarea/{id}:
 *   get:
 *     summary: Obtener una tarea específica
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tarea
 *     responses:
 *       200:
 *         description: Tarea encontrada
 *       404:
 *         description: Tarea no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/tarea/:id', authenticate(), tareaController.getTareaById);

/**
 * @swagger
 * /tarea/Create:
 *   post:
 *     summary: Crear una nueva tarea
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - fecha_creacion
 *             properties:
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fecha_creacion:
 *                 type: string
 *                 format: date-time
 *               estado:
 *                 type: string
 *                 default: preparado
 *               id_usuario:
 *                 type: integer
 *                 nullable: true
 *                 description: ID del usuario asignado (opcional)
 *           example:
 *             titulo: "Revisar historial médico"
 *             descripcion: "Revisar el historial médico del paciente"
 *             fecha_creacion: "2024-01-15T10:00:00Z"
 *             estado: "preparado"
 *             id_usuario: null
 *     responses:
 *       201:
 *         description: Tarea creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/tarea/Create', authenticate(), tareaController.createTarea);

/**
 * @swagger
 * /tarea/Update/{id}:
 *   put:
 *     summary: Actualizar una tarea
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tarea
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fecha_creacion:
 *                 type: string
 *                 format: date-time
 *               estado:
 *                 type: string
 *               id_usuario:
 *                 type: integer
 *                 nullable: true
 *                 description: ID del usuario asignado (opcional, puede ser null para desasignar)
 *           example:
 *             titulo: "Revisar historial médico actualizado"
 *             descripcion: "Revisar el historial médico del paciente - actualizado"
 *             estado: "en_proceso"
 *             id_usuario: null
 *     responses:
 *       200:
 *         description: Tarea actualizada exitosamente
 *       404:
 *         description: Tarea no encontrada
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/tarea/Update/:id', authenticate(), tareaController.updateTarea);

/**
 * @swagger
 * /tarea/Delete/{id}:
 *   delete:
 *     summary: Eliminar una tarea
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tarea
 *     responses:
 *       200:
 *         description: Tarea eliminada exitosamente
 *       404:
 *         description: Tarea no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/tarea/Delete/:id', authenticate(), tareaController.deleteTarea);

/**
 * @swagger
 * /tarea/Filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar tareas con paginación
 *     tags: [Tareas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cantidad de registros por página
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de página (comenzando en 1)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *                 description: Filtrar por título (búsqueda parcial)
 *               descripcion:
 *                 type: string
 *                 description: Filtrar por descripción (búsqueda parcial)
 *               fecha_creacion_desde:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de inicio del rango de fecha de creación
 *               fecha_creacion_hasta:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de fin del rango de fecha de creación
 *               estado:
 *                 type: string
 *                 description: Filtrar por estado
 *           example:
 *             titulo: "revisar"
 *             descripcion: "historial"
 *             fecha_creacion_desde: "2024-01-01T00:00:00Z"
 *             fecha_creacion_hasta: "2024-12-31T23:59:59Z"
 *             estado: "preparado"
 *     responses:
 *       200:
 *         description: Tareas filtradas con paginación (ordenadas por fecha de creación descendente)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/tarea/Filter/:limit/:page', authenticate(), tareaController.filterTareas);

module.exports = router;

