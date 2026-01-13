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

module.exports = router;
