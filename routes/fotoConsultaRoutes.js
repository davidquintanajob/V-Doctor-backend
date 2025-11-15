const express = require('express');
const router = express.Router();
const fotoConsultaController = require('../controllers/fotoConsultaController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: FotoConsulta
 *   description: API para gestionar las fotos de las consultas
 */

/**
 * @swagger
 * /FotoConsulta/{id}:
 *   get:
 *     summary: Obtiene una foto de consulta por su ID.
 *     tags: [FotoConsulta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID de la foto.
 *     responses:
 *       200:
 *         description: Una foto de consulta.
 *       404:
 *         description: Foto no encontrada.
 */
router.get('/FotoConsulta/:id', authenticate(), fotoConsultaController.getFotoConsultaById);

/**
 * @swagger
 * /FotoConsulta/create:
 *   post:
 *     summary: Crea una nueva foto de consulta.
 *     tags: [FotoConsulta]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_consulta:
 *                 type: integer
 *               nota:
 *                 type: string
 *               ruta:
 *                 type: string
 *                 format: byte
 *     responses:
 *       201:
 *         description: La foto de consulta creada.
 */
router.post('/FotoConsulta/create', authenticate(), fotoConsultaController.createFotoConsulta);

/**
 * @swagger
 * /FotoConsulta/update/{id}:
 *   put:
 *     summary: Actualiza una foto de consulta existente.
 *     tags: [FotoConsulta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID de la foto.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nota:
 *                 type: string
 *               ruta:
 *                 type: string
 *                 format: byte
 *     responses:
 *       200:
 *         description: La foto de consulta actualizada.
 */
router.put('/FotoConsulta/update/:id', authenticate(), fotoConsultaController.updateFotoConsulta);

/**
 * @swagger
 * /FotoConsulta/delete/{id}:
 *   delete:
 *     summary: Elimina una foto de consulta.
 *     tags: [FotoConsulta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID de la foto.
 *     responses:
 *       204:
 *         description: Foto eliminada.
 */
router.delete('/FotoConsulta/delete/:id', authenticate(), fotoConsultaController.deleteFotoConsulta);

/**
 * @swagger
 * /FotoConsulta/consulta/{id}:
 *   get:
 *     summary: Obtiene todas las fotos de una consulta.
 *     tags: [FotoConsulta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID de la consulta.
 *     responses:
 *       200:
 *         description: Una lista de fotos de la consulta.
 */
router.get('/FotoConsulta/consulta/:id', authenticate(), fotoConsultaController.getFotosByConsultaId);

module.exports = router;
