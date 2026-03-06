const express = require('express');
const router = express.Router();
const redondeoController = require('../controllers/redondeoController');

/**
 * @swagger
 * tags:
 *   name: Redondeo
 *   description: API para gestionar las opciones de redondeo
 */

/**
 * @swagger
 * /redondeo:
 *   get:
 *     summary: Obtener las opciones actuales de redondeo
 *     tags: [Redondeo]
 *     responses:
 *       200:
 *         description: Opciones de redondeo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 value:
 *                   type: string
 *       404:
 *         description: Opciones de redondeo no especificadas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/redondeo', redondeoController.getRedondeo);

/**
 * @swagger
 * /redondeo/updateRedondeo:
 *   put:
 *     summary: Actualizar las opciones de redondeo
 *     tags: [Redondeo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               isRedondeoFromPlus:
 *                 type: string
 *               costoFormula:
 *                 type: string
 *               telefono_contacto:
 *                 type: string
 *                 description: Telefono de contacto (texto)
 *             required:
 *               - value
 *     responses:
 *       200:
 *         description: Opciones de redondeo actualizadas
 *       400:
 *         description: Solicitud inválida
 *       500:
 *         description: Error interno del servidor
 */
router.put('/redondeo/updateRedondeo', redondeoController.updateRedondeo);

/**
 * @swagger
 * /redondeo/logo:
 *   post:
 *     summary: Actualizar el logo a partir de una imagen en base64
 *     tags: [Redondeo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: Imagen en formato base64 (puede incluir el prefijo data URI)
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: Logo actualizado correctamente
 *       400:
 *         description: Solicitud inválida
 *       500:
 *         description: Error interno del servidor
 */
router.post('/redondeo/logo', redondeoController.updateLogo);

module.exports = router;
