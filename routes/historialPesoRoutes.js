const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialPesoController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: HistorialPeso
 *   description: Registros de peso de pacientes
 */

/**
 * @swagger
 * /historial_peso:
 *   get:
 *     summary: Obtener todos los registros de historial de peso
 *     tags: [HistorialPeso]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de registros de peso
 *       500:
 *         description: Error interno del servidor
 */
router.get('/historial_peso', authenticate(), historialController.getAllHistorial);

/**
 * @swagger
 * /historial_peso/{id}:
 *   get:
 *     summary: Obtener un registro por ID
 *     tags: [HistorialPeso]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro
 *     responses:
 *       200:
 *         description: Registro encontrado
 *       404:
 *         description: Registro no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/historial_peso/:id', authenticate(), historialController.getHistorialById);

/**
 * @swagger
 * /historial_peso/Create:
 *   post:
 *     summary: Crear un nuevo registro de historial de peso
 *     tags: [HistorialPeso]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [peso, fecha, unidad_medida, id_paciente]
 *             properties:
 *               peso:
 *                 type: number
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               unidad_medida:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *           example:
 *             peso: 3.25
 *             fecha: "2024-02-01T10:00:00.000Z"
 *             unidad_medida: "kg"
 *             id_paciente: 1
 *     responses:
 *       201:
 *         description: Registro creado
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/historial_peso/Create', authenticate(), historialController.createHistorial);

/**
 * @swagger
 * /historial_peso/Update/{id}:
 *   put:
 *     summary: Actualizar un registro de historial de peso
 *     tags: [HistorialPeso]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [peso, fecha, unidad_medida, id_paciente]
 *             properties:
 *               peso:
 *                 type: number
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               unidad_medida:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Registro actualizado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Registro no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/historial_peso/Update/:id', authenticate(), historialController.updateHistorial);

/**
 * @swagger
 * /historial_peso/Delete/{id}:
 *   delete:
 *     summary: Eliminar un registro de historial de peso
 *     tags: [HistorialPeso]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del registro a eliminar
 *     responses:
 *       200:
 *         description: Registro eliminado
 *       404:
 *         description: Registro no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/historial_peso/Delete/:id', authenticate(), historialController.deleteHistorial);

/**
 * @swagger
 * /historial_peso/Filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar historial de peso con paginación
 *     tags: [HistorialPeso]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *         description: Registros por página
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de página (comienza en 1)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *               unidad_medida:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *               nombre_paciente:
 *                 type: string
 *           example:
 *             fecha_inicio: "2024-01-01"
 *             fecha_fin: "2024-12-31"
 *             unidad_medida: "kg"
 *             nombre_paciente: "Fido"
 *     responses:
 *       200:
 *         description: Resultados paginados
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/historial_peso/Filter/:limit/:page', authenticate(), historialController.filterHistorial);

module.exports = router;
