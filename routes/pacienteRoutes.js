const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: Pacientes
 *   description: API para gestionar pacientes
 */

/**
 * @swagger
 * /paciente:
 *   get:
 *     summary: Obtener todos los pacientes
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los pacientes
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
 *                   sexo:
 *                     type: string
 *                   raza:
 *                     type: string
 *                   especie:
 *                     type: string
 *                   numero_clinico:
 *                     type: integer
 *                   fecha_nacimiento:
 *                     type: string
 *                     format: date
 *                   foto_ruta:
 *                     type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get('/paciente', authenticate(), pacienteController.getAllPacientes);

/**
 * @swagger
 * /paciente/{id}:
 *   get:
 *     summary: Obtener un paciente específico
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Paciente encontrado
 *       404:
 *         description: Paciente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/paciente/:id', authenticate(), pacienteController.getPacienteById);

/**
 * @swagger
 * /paciente/Create:
 *   post:
 *     summary: Crear un nuevo paciente
 *     tags: [Pacientes]
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
 *               - sexo
 *               - raza
 *               - especie
 *               - fecha_nacimiento
 *             properties:
 *               nombre:
 *                 type: string
 *               sexo:
 *                 type: string
 *                 enum: [masculino, femenino, otros]
 *               raza:
 *                 type: string
 *               especie:
 *                 type: string
 *                 enum: [Canino, Felino, Ave, Roedor, Peces, Caprino, Porcino, Ovino, Otros]
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *               comprado_adoptado:
 *                 type: string
 *                 enum: [comprado, adoptado]
 *               historia_clinica:
 *                 type: string
 *               motivo_fallecimiento:
 *                 type: string
 *                 enum: [Eutanasia, Accidente, Enfermedad, Vejez, Otros]
 *               chip:
 *                 type: string
 *               agresividad:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               descuento:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               imagen:
 *                 type: string
 *                 description: Base64 encoded image (opcional). Si se proporciona, se guardará automáticamente en la carpeta de fotos del paciente
 *           example:
 *             nombre: "Fido"
 *             sexo: "masculino"
 *             raza: "Labrador"
 *             especie: "Canino"
 *             fecha_nacimiento: "2020-05-15"
 *             comprado_adoptado: "adoptado"
 *             historia_clinica: "Sin antecedentes"
 *             motivo_fallecimiento: null
 *             chip: "ABC123456"
 *             agresividad: 25
 *             descuento: 10
 *             imagen: null
 *     responses:
 *       201:
 *         description: Paciente creado exitosamente. Nota - numero_clinico se genera automáticamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/paciente/Create', authenticate(), pacienteController.createPaciente);

/**
 * @swagger
 * /paciente/Update/{id}:
 *   put:
 *     summary: Actualizar un paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               sexo:
 *                 type: string
 *                 enum: [masculino, femenino, otros]
 *               raza:
 *                 type: string
 *               especie:
 *                 type: string
 *                 enum: [Canino, Felino, Ave, Roedor, Peces, Caprino, Porcino, Ovino, Otros]
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *               comprado_adoptado:
 *                 type: string
 *                 enum: [comprado, adoptado]
 *               historia_clinica:
 *                 type: string
 *               motivo_fallecimiento:
 *                 type: string
 *                 enum: [Eutanasia, Accidente, Enfermedad, Vejez, Otros]
 *               chip:
 *                 type: string
 *               agresividad:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               descuento:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               imagen:
 *                 type: string
 *                 description: Base64 encoded image
 *     responses:
 *       200:
 *         description: Paciente actualizado exitosamente. Nota - numero_clinico no puede ser actualizado
 *       404:
 *         description: Paciente no encontrado
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/paciente/Update/:id', authenticate(), pacienteController.updatePaciente);

/**
 * @swagger
 * /paciente/Delete/{id}:
 *   delete:
 *     summary: Eliminar un paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *     responses:
 *       200:
 *         description: Paciente eliminado exitosamente
 *       404:
 *         description: Paciente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/paciente/Delete/:id', authenticate(), pacienteController.deletePaciente);

/**
 * @swagger
 * /paciente/Filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar pacientes con paginación
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cantidad de registros por página
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de página (comenzando en 1)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               raza:
 *                 type: string
 *               especie:
 *                 type: string
 *               sexo:
 *                 type: string
 *               numero_clinico:
 *                 type: integer
 *               nombre_cliente:
 *                 type: string
 *                 description: Filtrar por nombre del cliente asociado
 *               descripcion:
 *                 type: string
 *                 description: Búsqueda general en nombre, raza y especie
 *     responses:
 *       200:
 *         description: Pacientes filtrados con paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/paciente/Filter/:limit/:page', authenticate(), pacienteController.filterPacientes);

/**
 * @swagger
 * /paciente/CreateWithClients:
 *   post:
 *     summary: Crear un paciente con una lista de clientes asociados
 *     tags: [Pacientes]
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
 *               - sexo
 *               - raza
 *               - especie
 *               - fecha_nacimiento
 *               - clientes
 *             properties:
 *               nombre:
 *                 type: string
 *               sexo:
 *                 type: string
 *                 enum: [masculino, femenino, otros]
 *               raza:
 *                 type: string
 *               especie:
 *                 type: string
 *                 enum: [Canino, Felino, Ave, Roedor, Peces, Caprino, Porcino, Ovino, Otros]
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *               comprado_adoptado:
 *                 type: string
 *                 enum: [comprado, adoptado]
 *               historia_clinica:
 *                 type: string
 *               motivo_fallecimiento:
 *                 type: string
 *                 enum: [Eutanasia, Accidente, Enfermedad, Vejez, Otros]
 *               chip:
 *                 type: string
 *               agresividad:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               descuento:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               imagen:
 *                 type: string
 *                 description: Base64 encoded image
 *               clientes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - nombre
 *                     - telefono
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     telefono:
 *                       type: string
 *                     color:
 *                       type: string
 *                     direccion:
 *                       type: string
 *                     imagen:
 *                       type: string
 *                       description: Base64 encoded image
 *                 description: Lista de clientes a crear y asociar con el paciente
 *           examples:
 *             example1:
 *               value:
 *                 nombre: "Max"
 *                 sexo: "masculino"
 *                 raza: "Labrador"
 *                 especie: "Canino"
 *                 fecha_nacimiento: "2020-05-15"
 *                 comprado_adoptado: "comprado"
 *                 historia_clinica: "Paciente saludable, vacunas al día"
 *                 chip: "CH123456789"
 *                 agresividad: 20
 *                 descuento: 10
 *                 clientes:
 *                   - nombre: "Juan García"
 *                     telefono: "+56912345678"
 *                     color: "azul"
 *                     direccion: "Calle Principal 123, Santiago"
 *                   - nombre: "María López"
 *                     telefono: "22223344"
 *                     color: "rojo"
 *                     direccion: "Avenida Central 456, Providencia"
 *     responses:
 *       201:
 *         description: Paciente creado exitosamente con clientes asociados. Nota - numero_clinico se genera automáticamente
 *       400:
 *         description: Datos inválidos o datos de clientes inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/paciente/CreateWithClients', authenticate(), pacienteController.createPacienteWithClients);

module.exports = router;
