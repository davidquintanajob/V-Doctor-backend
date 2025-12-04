const express = require('express');
const router = express.Router();
const fotoServicioComplejoController = require('../controllers/fotoServicioComplejoController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: FotoServicioComplejo
 *   description: API para gestionar las fotos de los servicios complejos
 */

/**
 * @swagger
 * /FotoServicioComplejo/{id}:
 *   get:
 *     summary: Obtiene una foto de servicio complejo por su ID.
 *     tags: [FotoServicioComplejo]
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
 *         description: Una foto de servicio complejo.
 *       404:
 *         description: Foto no encontrada.
 */
router.get('/FotoServicioComplejo/:id', authenticate(), fotoServicioComplejoController.getFotoServicioComplejoById);

/**
 * @swagger
 * /FotoServicioComplejo/create:
 *   post:
 *     summary: Crea una nueva foto de servicio complejo asociada a una venta.
 *     tags: [FotoServicioComplejo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_venta:
 *                 type: integer
 *                 description: ID de la venta a la que pertenece la foto (obligatorio)
 *               imagen:
 *                 type: string
 *                 description: Imagen en Base64 (se guardará como .jpg)
 *               nota:
 *                 type: string
 *                 description: Nota opcional para la foto
 *             required:
 *               - id_venta
 *               - imagen
 *     responses:
 *       201:
 *         description: La foto del servicio complejo creada.
 */
router.post('/FotoServicioComplejo/create', authenticate(), fotoServicioComplejoController.createFotoServicioComplejo);

/**
 * @swagger
 * /FotoServicioComplejo/update/{id}:
 *   put:
 *     summary: Actualiza una foto de servicio complejo existente.
 *     tags: [FotoServicioComplejo]
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
 *               imagen:
 *                 type: string
 *                 description: Imagen en Base64 (se guardará como .jpg). Si se omite, solo se actualiza la nota.
 *     responses:
 *       200:
 *         description: La foto del servicio complejo actualizada.
 */
router.put('/FotoServicioComplejo/update/:id', authenticate(), fotoServicioComplejoController.updateFotoServicioComplejo);

/**
 * @swagger
 * /FotoServicioComplejo/delete/{id}:
 *   delete:
 *     summary: Elimina una foto de servicio complejo.
 *     tags: [FotoServicioComplejo]
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
router.delete('/FotoServicioComplejo/delete/:id', authenticate(), fotoServicioComplejoController.deleteFotoServicioComplejo);

/**
 * @swagger
 * /FotoServicioComplejo/servicio/{id}:
 *   get:
 *     summary: Obtiene todas las fotos asociadas a las ventas de un `servicio_complejo`.
 *     tags: [FotoServicioComplejo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del servicio complejo.
 *     responses:
 *       200:
 *         description: Una lista de fotos de servicio complejo.
 */
router.get('/FotoServicioComplejo/servicio/:id', authenticate(), fotoServicioComplejoController.getFotosByServicioComplejoId);

module.exports = router;
