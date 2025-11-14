const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: API para gestionar Clientes
 */

/**
 * @swagger
 * /cliente:
 *   get:
 *     summary: Obtener todos los clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los clientes con sus pacientes y ventas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente', authenticate(), clienteController.getAllClientes);

/**
 * @swagger
 * /cliente/{id}:
 *   get:
 *     summary: Obtener un cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado con lista de pacientes y ventas
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente/:id', authenticate(), clienteController.getClienteById);

/**
 * @swagger
 * /cliente/CreateCliente:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clientes]
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
 *               - telefono
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *                 description: Debe contener solo dígitos, + o -
 *               color:
 *                 type: string
 *               direccion:
 *                 type: string
 *                 description: Dirección del cliente (opcional)
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente (devuelve cliente con pacientes y ventas vacíos)
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/cliente/CreateCliente', authenticate(), clienteController.createCliente);

/**
 * @swagger
 * /cliente/UpdateCliente/{id}:
 *   put:
 *     summary: Actualizar un cliente existente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *                 description: Debe contener solo dígitos, + o -
 *               color:
 *                 type: string
 *               direccion:
 *                 type: string
 *                 description: Dirección del cliente (opcional)
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
 *       404:
 *         description: Cliente no encontrado
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/cliente/UpdateCliente/:id', authenticate(), clienteController.updateCliente);

/**
 * @swagger
 * /cliente/DeleteCliente/{id}:
 *   delete:
 *     summary: Eliminar un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente a eliminar
 *     responses:
 *       200:
 *         description: Cliente eliminado exitosamente
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/cliente/DeleteCliente/:id', authenticate(), clienteController.deleteCliente);

/**
 * @swagger
 * /cliente/filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar clientes con paginación (puede filtrar por nombre de mascota)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número máximo de clientes por página
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
 *             description: Criterios de filtro. Use nombre_mascota para filtrar por nombre de paciente.
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *                 description: Filtrar por dirección del cliente
 *               nombre_mascota:
 *                 type: string
 *                 description: Filtrar clientes que tengan un paciente cuyo nombre contenga este valor
 *     responses:
 *       200:
 *         description: Clientes filtrados con información de paginación
 *       400:
 *         description: Parámetros inválidos (limit o page no son números positivos)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/cliente/filter/:limit/:page', authenticate(), clienteController.filterClientes);

/**
 * @swagger
 * /cliente/CreateClienteWithPatients:
 *   post:
 *     summary: Crear cliente y lista de pacientes en una única operación (transaccional)
 *     tags: [Clientes]
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
 *               - telefono
 *               - pacientes
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *                 description: Debe contener solo dígitos, + o -
 *               color:
 *                 type: string
 *               direccion:
 *                 type: string
 *                 description: Dirección del cliente (opcional)
 *               pacientes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   description: Objeto paciente. No incluir numero_clinico ni foto_ruta.
 *                   required:
 *                     - nombre
 *                     - sexo
 *                     - raza
 *                     - especie
 *                     - fecha_nacimiento
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     sexo:
 *                       type: string
 *                       enum: [masculino, femenino, otros]
 *                     raza:
 *                       type: string
 *                     especie:
 *                       type: string
 *                       enum: [Canino, Felino, Ave, Roedor, Peces, Caprino, Porcino, Ovino, Otros]
 *                     fecha_nacimiento:
 *                       type: string
 *                       format: date
 *                     comprado_adoptado:
 *                       type: string
 *                       enum: [comprado, adoptado]
 *                     historia_clinica:
 *                       type: string
 *                     motivo_fallecimiento:
 *                       type: string
 *                       enum: [Eutanasia, Accidente, Enfermedad, Vejez, Otros]
 *                     chip:
 *                       type: string
 *                     agresividad:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                     descuento:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                     imagen:
 *                       type: string
 *                       description: Imagen en base64 opcional. Si se proporciona, se guardará en FOTOS_CARPETA_PACIENTE y foto_ruta se generará automáticamente. No enviar foto_ruta.
 *     responses:
 *       201:
 *         description: Cliente y pacientes creados correctamente. Devuelve cliente con pacientes y ventas.
 *       400:
 *         description: Datos inválidos en cliente o en la lista de pacientes
 *       500:
 *         description: Error interno del servidor
 */
router.post('/cliente/CreateClienteWithPatients', authenticate(), clienteController.createClienteWithPatients);

module.exports = router;
