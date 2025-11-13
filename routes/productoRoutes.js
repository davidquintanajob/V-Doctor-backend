const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const authenticate = require("../helpers/authenticate");

/**
 * @swagger
 * tags:
 *   name: Productos
 *   description: API para gestionar Productos
 */

/**
 * @swagger
 * /producto:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los productos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/producto', authenticate(), productoController.getAllProductos);

/**
 * @swagger
 * /producto/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/producto/:id', authenticate(), productoController.getProductoById);

/**
 * @swagger
 * /producto/CreateProducto:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Productos]
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
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/producto/CreateProducto', authenticate(), productoController.createProducto);

/**
 * @swagger
 * /producto/UpdateProducto/{id}:
 *   put:
 *     summary: Actualizar un producto existente
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a actualizar
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
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.put('/producto/UpdateProducto/:id', authenticate(), productoController.updateProducto);

/**
 * @swagger
 * /producto/DeleteProducto/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/producto/DeleteProducto/:id', authenticate(), productoController.deleteProducto);

/**
 * @swagger
 * /producto/filter/{limit}/{page}:
 *   post:
 *     summary: Filtrar productos con paginación
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número máximo de productos por página
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
 *     responses:
 *       200:
 *         description: Productos filtrados con información de paginación
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/producto/filter/:limit/:page', authenticate(), productoController.filterProductos);

module.exports = router;
