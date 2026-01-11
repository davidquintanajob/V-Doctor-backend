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
 * /moneda/updateMoneda:
 *   put:
 *     summary: Actualizar el valor de la moneda
 *     tags: [Moneda]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *                 description: "Valor numérico de la moneda (por ejemplo 500 o 3.5)."
 *               config:
 *                 type: object
 *                 description: "Opcional. Configuración para aplicar cambios en los costos de productos."
 *                 properties:
 *                   isCambioCostosProductos:
 *                     type: boolean
 *                     description: "Si es true, actualizará los costos de todos los productos según `tipo`."
 *                   tipo:
 *                     type: string
 *                     description: "Tipo de cambio a aplicar: 'cambiar usd' o 'cambiar cup'."
 *                     enum: ["cambiar usd", "cambiar cup"]
 *             required: [value]
 *           example:
 *             value: 500
 *             config:
 *               isCambioCostosProductos: true
 *               tipo: "cambiar usd"
 *     responses:
 *       200:
 *         description: Valor de la moneda actualizado
 *       400:
 *         description: Campo `value` faltante o configuración inválida en el body
 *       500:
 *         description: Error interno del servidor
 */
router.put('/moneda/updateMoneda', monedaController.updateMoneda);

module.exports = router;
