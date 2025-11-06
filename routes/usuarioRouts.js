const express = require("express");
const router = express.Router();
// Etiqueta taks
// Importar controlador de usuario
const usuarioController = require("../controllers/usuarioController");
const authenticate = require("../helpers/authenticate");

/**
 * @swagger
 * tags:
 *   - name: Usuario
 *     description: Operaciones relacionadas con usuarios
 */

/**
 * @swagger
 * /Usuario/createUsuario:
 *   post:
 *     tags: [Usuario]
 *     summary: Crear un nuevo usuario
 *     description: Crea un nuevo usuario con la información proporcionada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nombre: "Nuevo Usuario"
 *             nombre_usuario: "nuevo_user"
 *             cargo: "Comercial"
 *             contrasenna: "password123"
 *             rol: "Comercial"
 *             activo: true
 *             carnet_identidad: "01234567890"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               message: "Usuario creado exitosamente."
 *       400:
 *         description: Datos de entrada inválidos.
 *       500:
 *         description: Error del servidor.
 */
router.post("/Usuario/createUsuario",authenticate("Administrador"), usuarioController.createUsuario);

/**
 * @swagger
 * /Usuario:
 *   get:
 *     tags: [Usuario]
 *     summary: Obtener todos los usuarios
 *     description: Devuelve una lista de todos los usuarios registrados.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       500:
 *         description: Error del servidor.
 */
router.get("/Usuario",authenticate("Administrador"), usuarioController.getUsuarios);

/**
 * @swagger
 * /Usuario/{id}:
 *   get:
 *     tags: [Usuario]
 *     summary: Obtener un usuario por ID
 *     description: Devuelve un usuario específico usando su ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a obtener.
 *         schema:
 *           type: integer
 *           format: int32
 *     responses:
 *       200:
 *         description: Usuario encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   format: int32
 *                   description: ID del usuario.
 *                 nombre:
 *                   type: string
 *                   description: Nombre completo del usuario.
 *                 nombre_usuario:
 *                   type: string
 *                   description: Nombre de usuario único.
 *                 cargo:
 *                   type: string
 *                   description: Cargo o posición del usuario.
 *                 rol:
 *                   type: string
 *                   description: Rol del usuario (ej. Administrador, Comercial, Invitado).
 *                 activo:
 *                   type: boolean
 *                   description: Indica si el usuario está activo.
 *                 carnet_identidad:
 *                   type: string
 *                   description: Carnet de identidad (exactamente 11 dígitos numéricos).
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.get("/Usuario/:id", authenticate(), usuarioController.getUsuarioById);

/**
 * @swagger
 * /Usuario/updateUsuario/{id}:
 *   put:
 *     tags: [Usuario]
 *     summary: Actualizar un usuario
 *     description: Actualiza la información de un usuario específico por ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a actualizar.
 *         schema:
 *           type: integer
 *           format: int32
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nombre: "Nombre Actualizado"
 *             nombre_usuario: "usuario_actualizado"
 *             cargo: "Cargo Actualizado"
 *             contrasenna: "nueva_password"
 *             rol: "comercial"
 *             activo: true
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   format: int32
 *                   description: ID del usuario actualizado.
 *                 nombre:
 *                   type: string
 *                   description: Nombre completo del usuario.
 *                 nombre_usuario:
 *                   type: string
 *                   description: Nombre de usuario único.
 *                 cargo:
 *                   type: string
 *                   description: Cargo o posición del usuario.
 *                 rol:
 *                   type: string
 *                   description: Rol del usuario (ej. Administrador, Comercial, Invitado).
 *                 activo:
 *                   type: boolean
 *                   description: Indica si el usuario está activo.
 *             example:
 *               id: 1
 *               nombre: "Nombre Actualizado"
 *               nombre_usuario: "usuario_actualizado"
 *               cargo: "Cargo Actualizado"
 *               rol: "comercial"
 *               activo: true
 *             carnet_identidad: "01234567890"
 *       400:
 *         description: Datos de entrada inválidos.
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.put("/Usuario/updateUsuario/:id", authenticate("Administrador"), usuarioController.updateUsuario);

/**
 * @swagger
 * /Usuario/deleteUsuario/{id}:
 *   delete:
 *     tags: [Usuario]
 *     summary: Eliminar un usuario
 *     description: Elimina un usuario específico por ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del usuario a eliminar.
 *         schema:
 *           type: integer
 *           format: int32
 *     responses:
 *       204:
 *         description: Usuario eliminado exitosamente.
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.delete("/Usuario/deleteUsuario/:id",authenticate("Administrador"), usuarioController.deleteUsuario);

/**
 * @swagger
 * /Usuario/login:
 *   post:
 *     tags: [Usuario]
 *     summary: Iniciar sesión
 *     description: Inicia sesión con un usuario y contraseña.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_usuario:
 *                 type: string
 *                 description: Nombre de usuario.
 *               contrasenna:
 *                 type: string
 *                 description: Contraseña del usuario.
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token de autenticación JWT.
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación.
 *           example:
 *             token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             message: "Login exitoso"
 *       401:
 *         description: Contraseña incorrecta.
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error del servidor.
 */
router.post("/Usuario/login", usuarioController.login);

/**
 * @swagger
 * /Usuario/changePassword:
 *   post:
 *     tags: [Usuario]
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
 * /Usuario/filterUsers:
 *   post:
 *     tags: [Usuario]
 *     summary: Filtrar usuarios por múltiples criterios
 *     description: Permite filtrar usuarios por nombre, nombre de usuario, cargo y/o rol.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre completo del usuario para filtrar.
 *               nombre_usuario:
 *                 type: string
 *                 description: Nombre de usuario para filtrar.
 *               cargo:
 *                 type: string
 *                 description: Cargo o posición del usuario para filtrar.
 *               rol:
 *                 type: string
 *                 description: Rol del usuario para filtrar (ej. Administrador, Comercial, Invitado).
 *               carnet_identidad:
 *                 type: string
 *                 description: Carnet de identidad (exactamente 11 dígitos) para filtrar.
 *             example:
 *               nombre: "Usuario de Ejemplo"
 *               nombre_usuario: "ejemplo_user"
 *               cargo: "Desarrollador"
 *               rol: "comercial"
 *               carnet_identidad: "01234567890"
 *     responses:
 *       200:
 *         description: Lista de usuarios filtrados obtenida correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     format: int32
 *                     description: ID del usuario.
 *                   nombre:
 *                     type: string
 *                     description: Nombre completo del usuario.
 *                   nombre_usuario:
 *                     type: string
 *                     description: Nombre de usuario único.
 *                   cargo:
 *                     type: string
 *                     description: Cargo o posición del usuario.
 *                   rol:
 *                     type: string
 *                     description: Rol del usuario (ej. Administrador, Comercial, Invitado).
 *                   activo:
 *                     type: boolean
 *                     description: Indica si el usuario está activo.
 *       400:
 *         description: Datos de entrada inválidos.
 *       500:
 *         description: Error del servidor.
 */
router.post("/Usuario/filterUsers",authenticate("Administrador"), usuarioController.filterUsuarios);

module.exports = router;