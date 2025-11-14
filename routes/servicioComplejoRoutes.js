const express = require('express');
const router = express.Router();
const servicioComplejoController = require('../controllers/servicioComplejoController');
const authenticate = require('../helpers/authenticate');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = process.env.FOTOS_CARPETA_SERVICIO_COMPLEJO;
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

/**
 * @swagger
 * tags:
 *   name: ServicioComplejo
 *   description: API para gestionar servicios complejos
 * 
 * @swagger
 * components:
 *   schemas:
 *     ServicioComplejo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: El ID del servicio complejo.
 *         nombre:
 *           type: string
 *           description: El nombre del servicio complejo.
 *         descripcion:
 *           type: string
 *           description: La descripción del servicio complejo.
 *         precio:
 *           type: number
 *           description: El precio del servicio complejo.
 *         foto_servicio_complejo:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               imagen:
 *                 type: string
 *                 format: binary
 *               nota:
 *                 type: string
 */

/**
 * @swagger
 * /ServicioComplejo/filter/{limit}/{page}:
 *   post:
 *     summary: Filtra y pagina los servicios complejos.
 *     tags: [ServicioComplejo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número máximo de servicios por página
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
 *               tipo_servicio:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio_usd_min:
 *                 type: number
 *               precio_usd_max:
 *                 type: number
 *               precio_cup_min:
 *                 type: number
 *               precio_cup_max:
 *                 type: number
 *     responses:
 *       200:
 *         description: Una lista paginada de servicios complejos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServicioComplejo'
 */
router.post('/ServicioComplejo/filter/:limit/:page', authenticate(), servicioComplejoController.filterServiciosComplejosPaginated);

/**
 * @swagger
 * /ServicioComplejo:
 *   get:
 *     summary: Obtiene todos los servicios complejos.
 *     tags: [ServicioComplejo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Una lista de servicios complejos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServicioComplejo'
 */
router.get('/ServicioComplejo', authenticate(), servicioComplejoController.getAllServiciosComplejos);

/**
 * @swagger
 * /ServicioComplejo/{id}:
 *   get:
 *     summary: Obtiene un servicio complejo por su ID.
 *     tags: [ServicioComplejo]
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
 *         description: Un servicio complejo.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicioComplejo'
 *       404:
 *         description: Servicio complejo no encontrado.
 */
router.get('/ServicioComplejo/:id', authenticate(), servicioComplejoController.getServicioComplejoById);

/**
 * @swagger
 * /ServicioComplejo/create:
 *   post:
 *     summary: Crea un nuevo servicio complejo.
 *     tags: [ServicioComplejo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               precio_usd:
 *                 type: number
 *               precio_cup:
 *                 type: number
 *               roles_autorizados:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               tipo_servicio:
 *                 type: string
 *               calendario:
 *                 type: object
 *                 properties:
 *                   fecha:
 *                     type: string
 *                     format: date-time
 *                   descripcion:
 *                     type: string
 *                   id_paciente:
 *                     type: integer
 *                   id_usuario:
 *                     type: integer
 *     responses:
 *       201:
 *         description: El servicio complejo creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicioComplejo'
 */
router.post('/ServicioComplejo/create', authenticate(), servicioComplejoController.createServicioComplejo);

/**
 * @swagger
 * /ServicioComplejo/update/{id}:
 *   put:
 *     summary: Actualiza un servicio complejo existente.
 *     tags: [ServicioComplejo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: El ID del servicio complejo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               precio_usd:
 *                 type: number
 *               precio_cup:
 *                 type: number
 *               roles_autorizados:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               tipo_servicio:
 *                 type: string
 *               calendario:
 *                 type: object
 *                 properties:
 *                   fecha:
 *                     type: string
 *                     format: date-time
 *                   descripcion:
 *                     type: string
 *                   id_paciente:
 *                     type: integer
 *                   id_usuario:
 *                     type: integer
 *     responses:
 *       200:
 *         description: El servicio complejo actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServicioComplejo'
 */
router.put('/ServicioComplejo/update/:id', authenticate(), servicioComplejoController.updateServicioComplejo);

/**
 * @swagger
 * /ServicioComplejo/delete/{id}:
 *   delete:
 *     summary: Elimina un servicio complejo.
 *     tags: [ServicioComplejo]
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
 *       204:
 *         description: Servicio complejo eliminado.
 */
router.delete('/ServicioComplejo/delete/:id', authenticate(), servicioComplejoController.deleteServicioComplejo);

module.exports = router;
