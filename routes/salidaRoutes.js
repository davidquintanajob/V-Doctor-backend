const express = require('express');
const router = express.Router();
const salidaController = require('../controllers/salidaController');
const authenticate = require("../helpers/authenticate");

/**
 * @swagger
 * tags:
 *   name: Salidas
 *   description: API para gestionar Salidas de productos
 */

/**
 * @swagger
 * /salida/{id}:
 *   get:
 *     summary: Obtener una salida por ID
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la salida
 *     responses:
 *       200:
 *         description: Salida encontrada
 *       404:
 *         description: Salida no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/salida/:id', authenticate(), salidaController.getSalidaById);

/**
 * @swagger
 * /salida/CreateSalida:
 *   post:
 *     summary: Crear una nueva salida
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_comerciable
 *               - cantidad
 *               - cambio_moneda
 *               - nota
 *               - fecha
 *             properties:
 *               id_comerciable:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               cambio_moneda:
 *                 type: number
 *               nota:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Salida creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/salida/CreateSalida', authenticate(), salidaController.createSalida);

/**
 * @swagger
 * /salida/UpdateSalida/{id}:
 *   put:
 *     summary: Actualizar una salida existente
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la salida a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_comerciable:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               cambio_moneda:
 *                 type: number
 *               nota:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Salida actualizada exitosamente
 *       404:
 *         description: Salida no encontrada
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/salida/UpdateSalida/:id', authenticate(), salidaController.updateSalida);

/**
 * @swagger
 * /salida/DeleteSalida/{id}:
 *   delete:
 *     summary: Eliminar una salida
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la salida a eliminar
 *     responses:
 *       200:
 *         description: Salida eliminada exitosamente
 *       404:
 *         description: Salida no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/salida/DeleteSalida/:id', authenticate(), salidaController.deleteSalida);

/**
 * @swagger
 * /salida/filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar salidas con paginación
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número máximo de salidas por página
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de página (comenzando desde 1)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Criterios de filtro
 *             properties:
 *               fecha_desde:
 *                 type: string
 *                 format: date
 *               fecha_hasta:
 *                 type: string
 *                 format: date
 *               cantidad_min:
 *                 type: number
 *               cantidad_max:
 *                 type: number
 *               cambio_moneda_min:
 *                 type: number
 *               cambio_moneda_max:
 *                 type: number
 *               nota:
 *                 type: string
 *               id_comerciable:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Salidas filtradas con información de paginación
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/salida/filter/:limit/:page', authenticate(), salidaController.filterSalidas);

/**
 * @swagger
 * /salida:
 *   get:
 *     summary: Obtener todas las salidas
 *     tags: [Salidas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las salidas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/salida', authenticate(), salidaController.getAllSalidas);

module.exports = router;