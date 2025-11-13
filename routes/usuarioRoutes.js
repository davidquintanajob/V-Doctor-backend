const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authenticate = require("../helpers/authenticate");

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - nombre_natural
 *         - nombre_usuario
 *         - contrasenna
 *         - salario_diario
 *         - rol
 *       properties:
 *         id_usuario:
 *           type: integer
 *           description: ID único del usuario
 *         nombre_natural:
 *           type: string
 *           description: Nombre completo del usuario
 *         nombre_usuario:
 *           type: string
 *           description: Nombre de usuario único
 *         contrasenna:
 *           type: string
 *           description: Contraseña del usuario
 *         salario_diario:
 *           type: number
 *           format: float
 *           description: Salario diario del usuario
 *         rol:
 *           type: string
 *           enum: [Administrador, Médico, Recepcionista, Estilista]
 *           description: Rol del usuario en el sistema
 *         activo:
 *           type: boolean
 *           description: Estado activo del usuario
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *         ventas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Venta'
 *           description: Ventas asociadas al usuario
 *         entradas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Entrada'
 *           description: Entradas de productos realizadas por el usuario
 *         tareas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Tarea'
 *           description: Tareas asignadas al usuario
 *         calendarios:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Calendario'
 *           description: Eventos en el calendario del usuario
 *     Venta:
 *       type: object
 *       properties:
 *         id_venta:
 *           type: integer
 *         fecha:
 *           type: string
 *           format: date-time
 *         precio_original_comerciable_cup:
 *           type: number
 *           format: float
 *         precio_original_comerciable_usd:
 *           type: number
 *           format: float
 *         costo_producto_cup:
 *           type: number
 *           format: float
 *         cantidad:
 *           type: number
 *           format: float
 *         precio_cobrado_cup:
 *           type: number
 *           format: float
 *         forma_pago:
 *           type: string
 *           enum: [Efectivo, Transferencia]
 *         nota:
 *           type: string
 *         id_cliente:
 *           type: integer
 *         id_consulta:
 *           type: integer
 *         id_servicio_complejo:
 *           type: integer
 *     Entrada:
 *       type: object
 *       properties:
 *         id_entrada:
 *           type: integer
 *         nombre_proveedor:
 *           type: string
 *         fecha:
 *           type: string
 *           format: date-time
 *         cantidad:
 *           type: number
 *           format: float
 *         costo_cup:
 *           type: number
 *           format: float
 *         costo_usd:
 *           type: number
 *           format: float
 *         id_usuario:
 *           type: integer
 *         id_comerciable:
 *           type: integer
 *     Tarea:
 *       type: object
 *       properties:
 *         id_tarea:
 *           type: integer
 *         titulo:
 *           type: string
 *         descripcion:
 *           type: string
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *         id_usuario:
 *           type: integer
 *     Calendario:
 *       type: object
 *       properties:
 *         id_calendario:
 *           type: integer
 *         fecha:
 *           type: string
 *           format: date-time
 *         descripcion:
 *           type: string
 *         id_paciente:
 *           type: integer
 *         id_comerciable_servicio_complejo:
 *           type: integer
 *         id_usuario:
 *           type: integer
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total de elementos que coinciden con el filtro
 *         currentPage:
 *           type: integer
 *           description: Página actual
 *         limit:
 *           type: integer
 *           description: Número de elementos por página
 *         totalPages:
 *           type: integer
 *           description: Total de páginas disponibles
 *     UsuarioFilterResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Usuario'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /usuario:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los usuarios con sus relaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/usuario',authenticate(), usuarioController.getAllUsuarios);

/**
 * @swagger
 * /usuario/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado con sus relaciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/usuario/:id',authenticate(), usuarioController.getUsuarioById);

/**
 * @swagger
 * /usuario/CreateUsuario:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_natural
 *               - nombre_usuario
 *               - contrasenna
 *               - salario_diario
 *               - rol
 *             properties:
 *               nombre_natural:
 *                 type: string
 *                 description: Nombre completo del usuario
 *               nombre_usuario:
 *                 type: string
 *                 description: Nombre de usuario único
 *               contrasenna:
 *                 type: string
 *                 description: Contraseña del usuario
 *               salario_diario:
 *                 type: number
 *                 format: float
 *                 description: Salario diario del usuario
 *               rol:
 *                 type: string
 *                 enum: [Administrador, Médico, Recepcionista, Estilista]
 *                 description: Rol del usuario en el sistema
 *               activo:
 *                 type: boolean
 *                 description: Estado activo del usuario (opcional, por defecto true)
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/usuario/CreateUsuario',authenticate(), usuarioController.createUsuario);

/**
 * @swagger
 * /usuario/UpdateUsuario/{id}:
 *   put:
 *     summary: Actualizar un usuario existente
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_natural:
 *                 type: string
 *                 description: Nombre completo del usuario
 *               nombre_usuario:
 *                 type: string
 *                 description: Nombre de usuario único
 *               contrasenna:
 *                 type: string
 *                 description: Nueva contraseña del usuario
 *               salario_diario:
 *                 type: number
 *                 format: float
 *                 description: Salario diario del usuario
 *               rol:
 *                 type: string
 *                 enum: [Administrador, Médico, Recepcionista, Estilista]
 *                 description: Rol del usuario en el sistema
 *               activo:
 *                 type: boolean
 *                 description: Estado activo del usuario
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/usuario/UpdateUsuario/:id',authenticate(), usuarioController.updateUsuario);

/**
 * @swagger
 * /usuario/DeleteUsuario/{id}:
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/usuario/DeleteUsuario/:id',authenticate(), usuarioController.deleteUsuario);

/**
 * @swagger
 * /usuario/filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar usuarios con paginación
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número máximo de usuarios por página
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
 *             description: Criterios de filtro (búsqueda insensible a mayúsculas/minúsculas)
 *             properties:
 *               nombre_natural:
 *                 type: string
 *                 description: Filtrar por nombre natural (contiene)
 *               nombre_usuario:
 *                 type: string
 *                 description: Filtrar por nombre de usuario (contiene)
 *               rol:
 *                 type: string
 *                 description: Filtrar por rol (contiene)
 *               activo:
 *                 type: boolean
 *                 description: Filtrar por estado activo
 *             example:
 *               nombre_natural: "Juan"
 *               rol: "Médico"
 *               activo: true
 *     responses:
 *       200:
 *         description: Usuarios filtrados con información de paginación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsuarioFilterResponse'
 *       400:
 *         description: Parámetros inválidos (limit o page no son números positivos)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/usuario/filter/:limit/:page',authenticate(), usuarioController.filterUsuarios);

module.exports = router;
