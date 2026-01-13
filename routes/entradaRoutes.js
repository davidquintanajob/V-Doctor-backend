const express = require('express');
const router = express.Router();
const entradaController = require('../controllers/entradaController');
const authenticate = require("../helpers/authenticate");

/**
 * @swagger
 * tags:
 *   name: Entradas
 *   description: API para gestionar Entradas de productos
 */

/**
 * @swagger
 * /entrada/{id}:
 *   get:
 *     summary: Obtener una entrada por ID
 *     tags: [Entradas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la entrada
 *     responses:
 *       200:
 *         description: Entrada encontrada
 *       404:
 *         description: Entrada no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/entrada/:id', authenticate(), entradaController.getEntradaById);

/**
 * @swagger
 * /entrada/CreateEntrada:
 *   post:
 *     summary: Crear una nueva entrada
 *     tags: [Entradas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_usuario
 *               - id_comerciable
 *               - fecha
 *               - cantidad
 *               - costo_cup
 *               - costo_usd
 *             properties:
 *               id_usuario:
 *                 type: integer
 *               id_comerciable:
 *                 type: integer
 *               nombre_proveedor:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               cantidad:
 *                 type: number
 *               costo_cup:
 *                 type: number
 *               costo_usd:
 *                 type: number
 *     responses:
 *       201:
 *         description: Entrada creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/entrada/CreateEntrada', authenticate(), entradaController.createEntrada);

/**
 * @swagger
 * /entrada/UpdateEntrada/{id}:
 *   put:
 *     summary: Actualizar una entrada existente
 *     tags: [Entradas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la entrada a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_usuario:
 *                 type: integer
 *               id_comerciable:
 *                 type: integer
 *               nombre_proveedor:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               cantidad:
 *                 type: number
 *               costo_cup:
 *                 type: number
 *               costo_usd:
 *                 type: number
 *     responses:
 *       200:
 *         description: Entrada actualizada exitosamente
 *       404:
 *         description: Entrada no encontrada
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/entrada/UpdateEntrada/:id', authenticate(), entradaController.updateEntrada);

/**
 * @swagger
 * /entrada/DeleteEntrada/{id}:
 *   delete:
 *     summary: Eliminar una entrada
 *     tags: [Entradas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la entrada a eliminar
 *     responses:
 *       200:
 *         description: Entrada eliminada exitosamente
 *       404:
 *         description: Entrada no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/entrada/DeleteEntrada/:id', authenticate(), entradaController.deleteEntrada);

/**
 * @swagger
 * /entrada/filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar entradas con paginación
 *     tags: [Entradas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número máximo de entradas por página
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
 *               costo_cup_min:
 *                 type: number
 *               costo_cup_max:
 *                 type: number
 *               costo_usd_min:
 *                 type: number
 *               costo_usd_max:
 *                 type: number
 *               nombre_proveedor:
 *                 type: string
 *               nombre_usuario:
 *                 type: string
 *               nombre_producto:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entradas filtradas con información de paginación
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/entrada/filter/:limit/:page', authenticate(), entradaController.filterEntradas);

/**
 * @swagger
 * /entrada:
 *   get:
 *     summary: Obtener todas las entradas
 *     tags: [Entradas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las entradas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/entrada', authenticate(), entradaController.getAllEntradas);

// Obtener entradas por comerciable
router.get('/entrada/comerciable/:id_comerciable', authenticate(), entradaController.getEntradasByComerciable);

module.exports = router;
