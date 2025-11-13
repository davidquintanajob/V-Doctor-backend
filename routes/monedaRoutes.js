const express = require('express');
const router = express.Router();
const monedaController = require('../controllers/monedaController');

/**
 * @swagger
 * tags:
 *   name: Moneda
 *   description: API para gestionar el valor de la moneda
 */

/**
 * @swagger
 * /moneda:
 *   get:
 *     summary: Obtener el valor actual de la moneda
 *     tags: [Moneda]
 *     responses:
 *       200:
 *         description: Valor de la moneda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 value:
 *                   type: string
 *       404:
 *         description: Valor de la moneda no especificado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/moneda', monedaController.getMoneda);

/**
 * @swagger
 * /moneda/updateMoneda/{value}:
 *   put:
 *     summary: Actualizar el valor de la moneda
 *     tags: [Moneda]
 *     parameters:
 *       - in: path
 *         name: value
 *         required: true
 *         schema:
 *           type: string
 *         description: Nuevo valor de la moneda
 *     responses:
 *       200:
 *         description: Valor de la moneda actualizado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/moneda/updateMoneda/:value', monedaController.updateMoneda);

module.exports = router;
