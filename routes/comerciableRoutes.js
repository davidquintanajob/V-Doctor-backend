const express = require('express');
const router = express.Router();
const comerciableController = require('../controllers/comerciableController');
const authenticate = require("../helpers/authenticate");

/**
 * @swagger
 * tags:
 *   name: Comerciables
 *   description: API para gestionar comerciables
 */

/**
 * @swagger
 * /comerciable:
 *   get:
 *     summary: Obtener todos los comerciables
 *     tags: [Comerciables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los comerciables
 *       500:
 *         description: Error interno del servidor
 */
router.get('/comerciable', authenticate(), comerciableController.getAllComerciables);

/**
 * @swagger
 * /comerciable/{id}:
 *   get:
 *     summary: Obtener un comerciable por ID
 *     tags: [Comerciables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del comerciable
 *     responses:
 *       200:
 *         description: Comerciable encontrado
 *       404:
 *         description: Comerciable no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/comerciable/:id', authenticate(), comerciableController.getComerciableById);

/**
 * @swagger
 * /comerciable/filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar comerciables con paginación
 *     tags: [Comerciables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número máximo de comerciables por página
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
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio_cup_min:
 *                 type: number
 *               precio_cup_max:
 *                 type: number
 *               precio_usd_min:
 *                 type: number
 *               precio_usd_max:
 *                 type: number
 *               isProducto:
 *                 type: boolean
 *                 description: Filtrar solo comerciables que tengan asociación `producto` cuando es `true`.
 *               isMedicamento:
 *                 type: boolean
 *                 description: Filtrar solo comerciables cuyo `producto.medicamento` exista cuando es `true`.
 *               isServicio:
 *                 type: boolean
 *                 description: Filtrar solo comerciables que tengan asociación `servicio` cuando es `true`.
 *               isServicioComplejo:
 *                 type: boolean
 *                 description: Filtrar solo comerciables cuyo `servicio.servicio_complejo` exista cuando es `true`.
 *           example:
 *             nombre: ""
 *             descripcion: ""
 *             precio_cup_min: 0
 *             precio_cup_max: 0
 *             precio_usd_min: 0
 *             precio_usd_max: 0
 *             isProducto: true
 *             isMedicamento: true
 *     responses:
 *       200:
 *         description: Comerciables filtrados con información de paginación
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/comerciable/filter/:limit/:page', authenticate(), comerciableController.filterComerciables);

module.exports = router;
