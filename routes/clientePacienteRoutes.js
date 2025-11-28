const express = require('express');
const router = express.Router();
const clientePacienteController = require('../controllers/clientePacienteController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: Cliente-Paciente
 *   description: API para gestionar relaciones entre Clientes y Pacientes
 */

/**
 * @swagger
 * /cliente_paciente:
 *   get:
 *     summary: Obtener todas las relaciones cliente-paciente
 *     tags: [Cliente-Paciente]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las relaciones cliente-paciente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_cliente:
 *                     type: integer
 *                   id_paciente:
 *                     type: integer
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente_paciente', authenticate(), clientePacienteController.getAll);

/**
 * @swagger
 * /cliente_paciente/{id_cliente}/{id_paciente}:
 *   get:
 *     summary: Obtener una relación cliente-paciente específica
 *     tags: [Cliente-Paciente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *       - in: path
 *         name: id_paciente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Relación cliente-paciente encontrada
 *       404:
 *         description: Relación no encontrada
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente_paciente/:id_cliente/:id_paciente', authenticate(), clientePacienteController.getByIds);

/**
 * @swagger
 * /cliente_paciente/Create:
 *   post:
 *     summary: Crear una nueva relación cliente-paciente
 *     tags: [Cliente-Paciente]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_cliente
 *               - id_paciente
 *             properties:
 *               id_cliente:
 *                 type: integer
 *               id_paciente:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Relación creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/cliente_paciente/Create', authenticate(), clientePacienteController.create);

/**
 * @swagger
 * /cliente_paciente/Update/{id_cliente}/{id_paciente}:
 *   put:
 *     summary: Actualizar una relación cliente-paciente (reemplazar IDs)
 *     tags: [Cliente-Paciente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID original del cliente
 *       - in: path
 *         name: id_paciente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID original del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_cliente
 *               - id_paciente
 *             properties:
 *               id_cliente:
 *                 type: integer
 *                 description: Nuevo ID del cliente
 *               id_paciente:
 *                 type: integer
 *                 description: Nuevo ID del paciente
 *     responses:
 *       200:
 *         description: Relación actualizada exitosamente
 *       404:
 *         description: Relación original no encontrada
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/cliente_paciente/Update/:id_cliente/:id_paciente', authenticate(), clientePacienteController.update);

/**
 * @swagger
 * /cliente_paciente/Delete/{id_cliente}/{id_paciente}:
 *   delete:
 *     summary: Eliminar una relación cliente-paciente
 *     tags: [Cliente-Paciente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *       - in: path
 *         name: id_paciente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Relación eliminada exitosamente
 *       404:
 *         description: Relación no encontrada
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/cliente_paciente/Delete/:id_cliente/:id_paciente', authenticate(), clientePacienteController.remove);

/**
 * @swagger
 * /cliente_paciente/clients-by-patient/{id_paciente}:
 *   get:
 *     summary: Obtener todos los clientes asociados a un paciente
 *     tags: [Cliente-Paciente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_paciente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Lista de clientes relacionados con el paciente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_cliente:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   telefono:
 *                     type: string
 *                   direccion:
 *                     type: string
 *       400:
 *         description: Parámetro inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente_paciente/clients-by-patient/:id_paciente', authenticate(), clientePacienteController.clientsByPatient);

/**
 * @swagger
 * /cliente_paciente/patients-by-client/{id_cliente}:
 *   get:
 *     summary: Obtener todos los pacientes asociados a un cliente
 *     tags: [Cliente-Paciente]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Lista de pacientes relacionados con el cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_paciente:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   especie:
 *                     type: string
 *                   raza:
 *                     type: string
 *                   numero_clinico:
 *                     type: integer
 *       400:
 *         description: Parámetro inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente_paciente/patients-by-client/:id_cliente', authenticate(), clientePacienteController.patientsByClient);

/**
 * @swagger
 * /cliente_paciente/Sync:
 *   post:
 *     summary: Sincronizar relaciones entre listas de clientes y pacientes
 *     tags: [Cliente-Paciente]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientes
 *               - pacientes
 *             properties:
 *               clientes:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Lista de IDs de clientes (al menos 1)
 *               pacientes:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Lista de IDs de pacientes (al menos 1)
 *     responses:
 *       200:
 *         description: Relaciones sincronizadas exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Algún cliente o paciente no fue encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/cliente_paciente/Sync', authenticate(), clientePacienteController.syncRelations);

module.exports = router;
