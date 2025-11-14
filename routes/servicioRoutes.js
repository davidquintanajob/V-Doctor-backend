const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const authenticate = require("../helpers/authenticate");

/**
 * @swagger
 * tags:
 *   name: Servicios
 *   description: API para gestionar Servicios
 */

/**
 * @swagger
 * /servicio:
 *   get:
 *     summary: Obtener todos los servicios
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los servicios
 *       500:
 *         description: Error interno del servidor
 */
router.get('/servicio', authenticate(), servicioController.getAllServicios);

/**
 * @swagger
 * /servicio/{id}:
 *   get:
 *     summary: Obtener un servicio por ID
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio
 *     responses:
 *       200:
 *         description: Servicio encontrado
 *       404:
 *         description: Servicio no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/servicio/:id', authenticate(), servicioController.getServicioById);

/**
 * @swagger
 * /servicio/CreateServicio:
 *   post:
 *     summary: Crear un nuevo servicio
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - descripcion
 *               - precio_usd
 *               - precio_cup
 *             properties:
 *               descripcion:
 *                 type: string
 *               precio_usd:
 *                 type: number
 *               precio_cup:
 *                 type: number
 *               roles_autorizados:
 *                 type: string
 *     responses:
 *       201:
 *         description: Servicio creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/servicio/CreateServicio', authenticate(), servicioController.createServicio);

/**
 * @swagger
 * /servicio/UpdateServicio/{id}:
 *   put:
 *     summary: Actualizar un servicio existente
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descripcion:
 *                 type: string
 *               precio_usd:
 *                 type: number
 *               precio_cup:
 *                 type: number
 *               roles_autorizados:
 *                 type: string
 *     responses:
 *       200:
 *         description: Servicio actualizado exitosamente
 *       404:
 *         description: Servicio no encontrado
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/servicio/UpdateServicio/:id', authenticate(), servicioController.updateServicio);

/**
 * @swagger
 * /servicio/DeleteServicio/{id}:
 *   delete:
 *     summary: Eliminar un servicio
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del servicio a eliminar
 *     responses:
 *       200:
 *         description: Servicio eliminado exitosamente
 *       404:
 *         description: Servicio no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/servicio/DeleteServicio/:id', authenticate(), servicioController.deleteServicio);

/**
 * @swagger
 * /servicio/filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar servicios con paginación
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número máximo de servicios por página
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
 *               descripcion:
 *                 type: string
 *               precio_usd_min:
 *                 type: number
 *               precio_usd_max:
 *                 type: number
 *               precio_cup_min:
 *                 type: number
 *               precio_cup_max:
 *                 type: number
 *     responses:
 *       200:
 *         description: Servicios filtrados con información de paginación
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/servicio/filter/:limit/:page', authenticate(), servicioController.filterServicios);

module.exports = router;
