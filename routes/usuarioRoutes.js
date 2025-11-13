const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const authenticate = require("../helpers/authenticate");

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: API para gestionar Usuarios
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

/**
 * @swagger
 * /Usuario/changePassword:
 *   post:
 *     tags: [Usuarios]
 *     summary: Cambiar contraseña del usuario autenticado
 *     description: Requiere token Bearer. Valida la contraseña actual y la actualiza por la nueva.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [viejaContrasenna, nuevaContrasenna]
 *             properties:
 *               viejaContrasenna:
 *                 type: string
 *                 description: Contraseña actual
 *               nuevaContrasenna:
 *                 type: string
 *                 description: Contraseña nueva
 *           example:
 *             viejaContrasenna: "MiClaveActual123"
 *             nuevaContrasenna: "MiClaveNueva456"
 *     responses:
 *       200:
 *         description: Contraseña actualizada correctamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Contraseña actual incorrecta
 *       403:
 *         description: Token inválido o faltante
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post("/Usuario/changePassword", authenticate(), usuarioController.changePassword);

/**
 * @swagger
 * /usuario/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_usuario
 *               - contrasenna
 *             properties:
 *               nombre_usuario:
 *                 type: string
 *                 description: Nombre de usuario
 *               contrasenna:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso, devuelve el usuario y los tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Contraseña incorrecta
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/usuario/login', usuarioController.login);

module.exports = router;
