const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/consultaController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: Consultas
 *   description: API para gestionar consultas veterinarias
 */

/**
 * @swagger
 * /consulta:
 *   get:
 *     summary: Obtener todas las consultas
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las consultas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_consulta:
 *                     type: integer
 *                   fecha:
 *                     type: string
 *                     format: date-time
 *                   motivo:
 *                     type: string
 *                   diagnostico:
 *                     type: string
 *                   anamnesis:
 *                     type: string
 *                   tratamiento:
 *                     type: string
 *                   patologia:
 *                     type: string
 *                   id_paciente:
 *                     type: integer
 *                   id_usuario:
 *                     type: integer
 *                   paciente:
 *                     type: object
 *                     description: Datos del paciente asociado
 *                   usuario:
 *                     type: object
 *                     description: Datos del usuario que realizó la consulta
 *                   foto_consultas:
 *                     type: array
 *                     description: Lista de fotos asociadas a la consulta
 *       500:
 *         description: Error interno del servidor
 */
router.get('/consulta', authenticate(), consultaController.getAllConsultas);

/**
 * @swagger
 * /consulta/{id}:
 *   get:
 *     summary: Obtener una consulta específica
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la consulta
 *     responses:
 *       200:
 *         description: Consulta encontrada. Incluye datos del usuario, paciente y fotos asociadas
 *       404:
 *         description: Consulta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/consulta/:id', authenticate(), consultaController.getConsultaById);

/**
 * @swagger
 * /consulta/Create:
 *   post:
 *     summary: Crear una nueva consulta
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *               - motivo
 *               - anamnesis
 *               - id_paciente
 *               - id_usuario
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               motivo:
 *                 type: string
 *               diagnostico:
 *                 type: string
 *               anamnesis:
 *                 type: string
 *               tratamiento:
 *                 type: string
 *               patologia:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *           example:
 *             fecha: "2025-11-14T10:30:00Z"
 *             motivo: "Revisión general y vacunas"
 *             diagnostico: "Paciente saludable"
 *             anamnesis: "Paciente sin síntomas previos"
 *             tratamiento: "Aplicar vacunas"
 *             patologia: "Sin patologías"
 *             id_paciente: 1
 *             id_usuario: 1
 *     responses:
 *       201:
 *         description: Consulta creada exitosamente. Incluye datos del usuario, paciente y fotos asociadas
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/consulta/Create', authenticate(), consultaController.createConsulta);

/**
 * @swagger
 * /consulta/Update/{id}:
 *   put:
 *     summary: Actualizar una consulta
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la consulta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               motivo:
 *                 type: string
 *               diagnostico:
 *                 type: string
 *               anamnesis:
 *                 type: string
 *               tratamiento:
 *                 type: string
 *               patologia:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Consulta actualizada exitosamente. Incluye datos del usuario, paciente y fotos asociadas
 *       404:
 *         description: Consulta no encontrada
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/consulta/Update/:id', authenticate(), consultaController.updateConsulta);

/**
 * @swagger
 * /consulta/Delete/{id}:
 *   delete:
 *     summary: Eliminar una consulta
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la consulta
 *     responses:
 *       200:
 *         description: Consulta eliminada exitosamente
 *       404:
 *         description: Consulta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/consulta/Delete/:id', authenticate(), consultaController.deleteConsulta);

/**
 * @swagger
 * /consulta/Filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar consultas con paginación
 *     tags: [Consultas]
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
 *               motivo:
 *                 type: string
 *               diagnostico:
 *                 type: string
 *               anamnesis:
 *                 type: string
 *               tratamiento:
 *                 type: string
 *               patologia:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *               nombre_paciente:
 *                 type: string
 *                 description: Filtrar por nombre del paciente asociado
 *               fecha_desde:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha inicial del rango (inclusive)
 *               fecha_hasta:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha final del rango (inclusive)
 *               descripcion:
 *                 type: string
 *                 description: Búsqueda general en motivo, diagnostico, anamnesis, tratamiento y patologia
 *     responses:
 *       200:
 *         description: Consultas filtradas con paginación. Cada consulta incluye datos del usuario, paciente y fotos asociadas
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
router.post('/consulta/Filter/:limit/:page', authenticate(), consultaController.filterConsultas);

/**
 * @swagger
 * /consulta/CreateWithPhotos:
 *   post:
 *     summary: Crear una consulta con una lista de fotos asociadas
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *               - motivo
 *               - anamnesis
 *               - id_paciente
 *               - id_usuario
 *               - fotos
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               motivo:
 *                 type: string
 *               diagnostico:
 *                 type: string
 *               anamnesis:
 *                 type: string
 *               tratamiento:
 *                 type: string
 *               patologia:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *               fotos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - imagen
 *                   properties:
 *                     imagen:
 *                       type: string
 *                       description: Base64 encoded image (requerido)
 *                     nota:
 *                       type: string
 *                       description: Nota descriptiva sobre la foto (opcional)
 *                 description: Lista de fotos a guardar. Las imágenes se guardarán con el formato {id_consulta}-{indice}
 *           examples:
 *             example1:
 *               value:
 *                 fecha: "2025-11-14T10:30:00Z"
 *                 motivo: "Revisión general y análisis de radiografía"
 *                 diagnostico: "Fractura leve en pata trasera"
 *                 anamnesis: "Paciente traumatismo hace 2 días"
 *                 tratamiento: "Inmovilización y reposo"
 *                 patologia: "Fractura"
 *                 id_paciente: 1
 *                 id_usuario: 1
 *                 fotos:
 *                   - imagen: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
 *                     nota: "Radiografía de pata trasera derecha"
 *                   - imagen: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
 *                     nota: "Vista lateral de la fractura"
 *     responses:
 *       201:
 *         description: Consulta creada exitosamente con fotos asociadas. Las imágenes se guardan automáticamente en la carpeta configurada en FOTOS_CARPETA_CONSULTA. Incluye datos del usuario, paciente y todas las fotos asociadas
 *       400:
 *         description: Datos inválidos o fotos sin imágenes Base64
 *       500:
 *         description: Error interno del servidor
 */
router.post('/consulta/CreateWithPhotos', authenticate(), consultaController.createConsultaWithPhotos);

/**
 * @swagger
 * /consulta/UpdateWithPhotos/{id}:
 *   put:
 *     summary: Actualizar una consulta y reemplazar sus fotos
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la consulta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               motivo:
 *                 type: string
 *               diagnostico:
 *                 type: string
 *               anamnesis:
 *                 type: string
 *               tratamiento:
 *                 type: string
 *               patologia:
 *                 type: string
 *               id_paciente:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *               fotos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     imagen:
 *                       type: string
 *                       description: Base64 encoded image
 *                     nota:
 *                       type: string
 *     responses:
 *       200:
 *         description: Consulta actualizada exitosamente. Si se pasaron fotos, las antiguas se reemplazan por las nuevas.
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Consulta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/consulta/UpdateWithPhotos/:id', authenticate(), consultaController.updateConsultaWithPhotos);
module.exports = router;
