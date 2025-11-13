const express = require('express');
const router = express.Router();
const medicamentoController = require('../controllers/medicamentoController');
const authenticate = require("../helpers/authenticate");

/**
 * @swagger
 * tags:
 *   name: Medicamentos
 *   description: API para gestionar Medicamentos
 */

/**
 * @swagger
 * /medicamento:
 *   get:
 *     summary: Obtener todos los medicamentos
 *     tags: [Medicamentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los medicamentos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/medicamento', authenticate(), medicamentoController.getAllMedicamentos);

/**
 * @swagger
 * /medicamento/{id}:
 *   get:
 *     summary: Obtener un medicamento por ID
 *     tags: [Medicamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del medicamento
 *     responses:
 *       200:
 *         description: Medicamento encontrado
 *       404:
 *         description: Medicamento no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/medicamento/:id', authenticate(), medicamentoController.getMedicamentoById);

/**
 * @swagger
 * /medicamento/CreateMedicamento:
 *   post:
 *     summary: Crear un nuevo medicamento
 *     tags: [Medicamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - costo_usd
 *               - costo_cup
 *               - categoria
 *               - codigo
 *               - cantidad
 *               - precio_usd
 *               - precio_cup
 *               - tipo_medicamento
 *               - unidad_medida
 *             properties:
 *               nombre:
 *                 type: string
 *               costo_usd:
 *                 type: number
 *               costo_cup:
 *                 type: number
 *               categoria:
 *                 type: string
 *               nota:
 *                 type: string
 *               codigo:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               precio_usd:
 *                 type: number
 *               precio_cup:
 *                 type: number
 *               roles_autorizados:
 *                 type: string
 *               tipo_medicamento:
 *                 type: string
 *               unidad_medida:
 *                 type: string
 *               posologia:
 *                 type: string
 *     responses:
 *       201:
 *         description: Medicamento creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/medicamento/CreateMedicamento', authenticate(), medicamentoController.createMedicamento);

/**
 * @swagger
 * /medicamento/UpdateMedicamento/{id}:
 *   put:
 *     summary: Actualizar un medicamento existente
 *     tags: [Medicamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del medicamento a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               costo_usd:
 *                 type: number
 *               costo_cup:
 *                 type: number
 *               categoria:
 *                 type: string
 *               nota:
 *                 type: string
 *               codigo:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               precio_usd:
 *                 type: number
 *               precio_cup:
 *                 type: number
 *               roles_autorizados:
 *                 type: string
 *               tipo_medicamento:
 *                 type: string
 *               unidad_medida:
 *                 type: string
 *               posologia:
 *                 type: string
 *     responses:
 *       200:
 *         description: Medicamento actualizado exitosamente
 *       404:
 *         description: Medicamento no encontrado
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/medicamento/UpdateMedicamento/:id', authenticate(), medicamentoController.updateMedicamento);

/**
 * @swagger
 * /medicamento/DeleteMedicamento/{id}:
 *   delete:
 *     summary: Eliminar un medicamento
 *     tags: [Medicamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del medicamento a eliminar
 *     responses:
 *       200:
 *         description: Medicamento eliminado exitosamente
 *       404:
 *         description: Medicamento no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/medicamento/DeleteMedicamento/:id', authenticate(), medicamentoController.deleteMedicamento);

/**
 * @swagger
 * /medicamento/filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar medicamentos con paginación
 *     tags: [Medicamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número máximo de medicamentos por página
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
 *               posologia:
 *                 type: string
 *               unidad_medida:
 *                 type: string
 *               nombre:
 *                 type: string
 *               categoria:
 *                 type: string
 *               codigo:
 *                 type: string
 *               costo_usd_min:
 *                 type: number
 *               costo_usd_max:
 *                 type: number
 *               costo_cup_min:
 *                 type: number
 *               costo_cup_max:
 *                 type: number
 *               cantidad_min:
 *                 type: number
 *               cantidad_max:
 *                 type: number
 *               precio_usd_min:
 *                 type: number
 *               precio_usd_max:
 *                 type: number
 *               precio_cup_min:
 *                 type: number
 *               precio_cup_max:
 *                 type: number
 *               tipo_medicamento:
 *                 type: string
 *     responses:
 *       200:
 *         description: Medicamentos filtrados con información de paginación
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/medicamento/filter/:limit/:page', authenticate(), medicamentoController.filterMedicamentos);

module.exports = router;
