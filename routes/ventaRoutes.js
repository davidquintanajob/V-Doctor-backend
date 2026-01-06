const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: Venta
 *   description: Operaciones sobre ventas
 */

/**
 * @swagger
 * /venta:
 *   get:
 *     summary: Obtiene todas las ventas con sus relaciones anidadas.
 *     tags: [Venta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ventas
 */
router.get('/venta', authenticate(), ventaController.getAllVentas);

/**
 * @swagger
 * /venta/{id}:
 *   get:
 *     summary: Obtiene una venta por su ID con relaciones anidadas.
 *     tags: [Venta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venta encontrada
 *       404:
 *         description: Venta no encontrada
 */
router.get('/venta/:id', authenticate(), ventaController.getVentaById);

/**
 * @swagger
 * /venta/validate:
 *   post:
 *     summary: Valida los datos de una venta ANTES de crearla. Retorna status 200 si es válida o 400 con errores si no.
 *     tags: [Venta]
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
 *               - precio_original_comerciable_cup
 *               - precio_original_comerciable_usd
 *               - cantidad
 *               - precio_cobrado_cup
 *               - forma_pago
 *               - id_usuario
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               precio_original_comerciable_cup:
 *                 type: number
 *               precio_original_comerciable_usd:
 *                 type: number
 *               costo_producto_cup:
 *                 type: number
 *               cantidad:
 *                 type: number
 *               precio_cobrado_cup:
 *                 type: number
 *               forma_pago:
 *                 type: string
 *                 enum: ["Efectivo", "Transferencia"]
 *               nota:
 *                 type: string
 *               id_cliente:
 *                 type: integer
 *               id_consulta:
 *                 type: integer
 *               id_servicio_complejo:
 *                 type: integer
 *               id_comerciable:
 *                 type: integer
 *               id_usuario:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *               exedente_redondeo:
 *                 type: number
 *                 description: No puede ser negativo. Si no se provee, por defecto es 0.
 *     responses:
 *       200:
 *         description: La venta es válida y puede ser creada
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             valid:
 *               type: boolean
 *       400:
 *         description: Hay errores de validación
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             valid:
 *               type: boolean
 *             errors:
 *               type: array
 *               items:
 *                 type: string
 */
router.post('/venta/validate', authenticate(), ventaController.validateVenta);

/**
 * @swagger
 * /venta/validateUpdate/{id}:
 *   post:
 *     summary: Valida los datos de una venta ANTES de actualizarla. Retorna status 200 si es válida o 400 con errores si no.
 *     tags: [Venta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               precio_original_comerciable_cup:
 *                 type: number
 *                 description: No puede ser negativo
 *               precio_original_comerciable_usd:
 *                 type: number
 *                 description: No puede ser negativo
 *               costo_producto_cup:
 *                 type: number
 *                 description: No puede ser negativo
 *               cantidad:
 *                 type: number
 *                 description: No puede ser negativo. Si id_comerciable es producto, no puede exceder cantidad disponible.
 *               precio_cobrado_cup:
 *                 type: number
 *                 description: No puede ser negativo
 *               forma_pago:
 *                 type: string
 *                 enum: ["Efectivo", "Transferencia"]
 *               nota:
 *                 type: string
 *               id_cliente:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir
 *               id_consulta:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir
 *               id_servicio_complejo:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir
 *               id_comerciable:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir y reemplaza el comerciable. Si es un producto, todos los usuarios deben estar autorizados. El inventario del producto anterior se restituye y el nuevo se descuenta.
 *               id_usuario:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 example: [1, 2, 3]
 *                 description: Opcional, si se proporciona reemplaza la lista, todos deben existir y estar autorizados en el comerciable actual o nuevo.
 *               exedente_redondeo:
 *                 type: number
 *                 description: No puede ser negativo. Si no se provee, por defecto es 0.
 *     responses:
 *       200:
 *         description: La venta es válida y puede ser actualizada
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             valid:
 *               type: boolean
 *       400:
 *         description: Hay errores de validación
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *             valid:
 *               type: boolean
 *             errors:
 *               type: array
 *               items:
 *                 type: string
 *       404:
 *         description: Venta no encontrada
 */
router.post('/venta/validateUpdate/:id', authenticate(), ventaController.validateUpdate);
// Alias con ortografía alternativa (no documentado explícitamente)
router.post('/venta/validadteUpdate/:id', authenticate(), ventaController.validateUpdate);

/**
 * @swagger
 * /venta/create:
 *   post:
 *     summary: Crea una venta. Validaciones - id_usuario obligatorio, valores numéricos no negativos, IDs opcionales deben existir, roles autorizados si hay comerciable, cantidad de producto disponible.
 *     tags: [Venta]
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
 *               - precio_original_comerciable_cup
 *               - precio_original_comerciable_usd
 *               - cantidad
 *               - precio_cobrado_cup
 *               - forma_pago
 *               - id_usuario
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date-time
 *               precio_original_comerciable_cup:
 *                 type: number
 *                 description: No puede ser negativo
 *               precio_original_comerciable_usd:
 *                 type: number
 *                 description: No puede ser negativo
 *               costo_producto_cup:
 *                 type: number
 *                 description: No puede ser negativo
 *               cantidad:
 *                 type: number
 *                 description: No puede ser negativo. Si id_comerciable es producto, no puede exceder cantidad disponible.
 *               precio_cobrado_cup:
 *                 type: number
 *                 description: No puede ser negativo
 *               forma_pago:
 *                 type: string
 *                 enum: ["Efectivo", "Transferencia"]
 *               nota:
 *                 type: string
 *               id_cliente:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir
 *               id_consulta:
 *               exedente_redondeo:
 *                 type: number
 *                 description: No puede ser negativo. Si no se provee, por defecto es 0.
 *               id_servicio_complejo:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir
 *               id_comerciable:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir. Si es un producto, todos los usuarios deben estar autorizados y cantidad debe ser <= cantidad disponible. La cantidad se restará al crear la venta.
 *               id_usuario:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 example: [1, 2, 3]
 *                 description: Obligatorio, al menos 1 usuario, todos deben existir. Si id_comerciable está presente, todos los usuarios deben tener rol dentro de roles_autorizados del comerciable.
 *     responses:
 *       201:
 *         description: Venta creada exitosamente
 *       400:
 *         description: Error de validación (campos obligatorios faltantes, valores negativos, IDs inválidos, usuarios no autorizados, cantidad insuficiente de producto)
 */
router.post('/venta/create', authenticate(), ventaController.createVenta);

/**
 * @swagger
 * /venta/update/{id}:
 *   put:
 *     summary: Actualiza una venta. Validaciones - valores numéricos no negativos, IDs opcionales deben existir si se proporcionan, roles autorizados, cantidad de producto disponible.
 *     tags: [Venta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               precio_original_comerciable_cup:
 *                 type: number
 *                 description: No puede ser negativo
 *               precio_original_comerciable_usd:
 *                 type: number
 *                 description: No puede ser negativo
 *               costo_producto_cup:
 *                 type: number
 *                 description: No puede ser negativo
 *               cantidad:
 *                 type: number
 *                 description: No puede ser negativo. Si cambia y el comerciable es un producto, la diferencia se restará del inventario.
 *               precio_cobrado_cup:
 *                 type: number
 *                 description: No puede ser negativo
 *               forma_pago:
 *                 type: string
 *                 enum: ["Efectivo", "Transferencia"]
 *               nota:
 *                 type: string
 *               id_cliente:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir
 *               id_consulta:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir
 *               id_servicio_complejo:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir
 *               id_comerciable:
 *                 type: integer
 *                 description: Opcional, si se proporciona debe existir y reemplaza el comerciable. Si es un producto, todos los usuarios deben estar autorizados. El inventario del producto anterior se restituye y el nuevo se descuenta.
 *               id_usuario:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 example: [1, 2, 3]
 *                 description: Opcional, si se proporciona reemplaza la lista, todos deben existir y estar autorizados en el comerciable actual o nuevo.
 *     responses:
 *       200:
 *         description: Venta actualizada exitosamente
 *       400:
 *         description: Error de validación (valores negativos, IDs inválidos, usuarios no autorizados, cantidad insuficiente de producto)
 *       404:
 *         description: Venta no encontrada
 */
router.put('/venta/update/:id', authenticate(), ventaController.updateVenta);

/**
 * @swagger
 * /venta/delete/{id}:
 *   delete:
 *     summary: Elimina una venta y sus asociaciones con usuarios.
 *     tags: [Venta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Venta eliminada
 *       404:
 *         description: Venta no encontrada
 */
router.delete('/venta/delete/:id', authenticate(), ventaController.deleteVenta);

/**
 * @swagger
 * /venta/Filter/{limit}/{page}:
 *   post:
 *     summary: Filtra ventas con paginado. Permite filtrado por fecha (rango), precios (min/max), usuario, cliente, producto, servicio, paciente y más.
 *     tags: [Venta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha_desde:
 *                 type: string
 *                 format: date-time
 *               fecha_hasta:
 *                 type: string
 *                 format: date-time
 *               precio_original_comerciable_cup_min:
 *                 type: number
 *               precio_original_comerciable_cup_max:
 *                 type: number
 *               precio_original_comerciable_usd_min:
 *                 type: number
 *               precio_original_comerciable_usd_max:
 *                 type: number
 *               costo_producto_cup_min:
 *                 type: number
 *               costo_producto_cup_max:
 *                 type: number
 *               precio_cobrado_cup_min:
 *                 type: number
 *               precio_cobrado_cup_max:
 *                 type: number
 *               nombre_usuario:
 *                 type: string
 *               nombre_cliente:
 *                 type: string
 *               nombre_producto:
 *                 type: string
 *               descripcion_servicio:
 *                 type: string
 *               nombre_paciente:
 *                 type: string
 *               cantidad:
 *                 type: number
 *               nota:
 *                 type: string
 *               forma_pago:
 *                 type: string
 *               tipo_comerciable:
 *                 type: string
 *               detallado:
 *                 type: boolean
 *                 default: true
 *                 description: Si es true retorna solo ventas con servicio_complejo, si es false también incluye ventas sin servicio_complejo (id_servicio_complejo es null)
 *     responses:
 *       200:
 *         description: Lista filtrada de ventas con paginación
 */
router.post('/venta/Filter/:limit/:page', authenticate(), ventaController.filterVentas);

/**
 * @swagger
 * /venta/{id}/usuarios:
 *   put:
 *     summary: Actualiza la relación muchos-a-muchos entre una venta y usuarios. Reemplaza todos los usuarios asociados. Valida que todos los usuarios estén autorizados en el comerciable si existe.
 *     tags: [Venta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la venta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuarios:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *             description: Lista de IDs de usuarios. Si la venta tiene id_comerciable, todos los usuarios deben estar autorizados (rol dentro de roles_autorizados del comerciable).
 *     responses:
 *       200:
 *         description: Relación actualizada
 *       400:
 *         description: Validación fallida (sin usuarios, usuarios no existen, usuarios no autorizados en el comerciable)
 *       404:
 *         description: Venta no encontrada
 */
router.put('/venta/:id/usuarios', authenticate(), ventaController.updateVentaUsuarios);

/**
 * @swagger
 * /venta/medicamentoPaciente/{paciente}/{tipo_medicamento}:
 *   get:
 *     summary: Obtiene las ventas de un paciente donde el comerciable es un producto y su medicamento tiene el tipo indicado.
 *     tags: [Venta]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paciente
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del paciente
 *       - in: path
 *         name: tipo_medicamento
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de medicamento (debe coincidir con los tipos definidos en el modelo `Medicamento`)
 *     responses:
 *       200:
 *         description: Lista de ventas que coinciden
 *       400:
 *         description: Tipo de medicamento inválido
 *       404:
 *         description: Paciente no encontrado
 */
router.get('/venta/medicamentoPaciente/:paciente/:tipo_medicamento', authenticate(), ventaController.getVentasMedicamentoPaciente);

module.exports = router;