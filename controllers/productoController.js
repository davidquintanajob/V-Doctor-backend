const productoService = require('../services/productoService');
const { roles } = require('../models/usuario');

const getAllProductos = async (req, res) => {
    try {
        const productos = await productoService.getAllProductos();
        res.status(200).json(productos);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const getProductoById = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await productoService.getProductoById(id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const createProducto = async (req, res) => {
    const { nombre, costo_usd, costo_cup, categoria, codigo, cantidad, precio_usd, precio_cup, roles_autorizados } = req.body;
    const errors = [];

    if (roles_autorizados) {
        const rolesArray = roles_autorizados.split(',').map(role => role.trim());
        for (const role of rolesArray) {
            if (!roles.includes(role)) {
                errors.push(`El rol especificado '${role}' no es válido.`);
            }
        }
    }

    if (!nombre) errors.push("El nombre es requerido");
    if (!costo_usd) errors.push("El costo_usd es requerido");
    if (!costo_cup) errors.push("El costo_cup es requerido");
    if (!categoria) errors.push("La categoria es requerida");
    if (!codigo) errors.push("El codigo es requerido");
    if (!precio_usd) errors.push("El precio_usd es requerido");
    if (!precio_cup) errors.push("El precio_cup es requerido");

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const newProducto = await productoService.createProducto(req.body);
        res.status(201).json(newProducto);
    } catch (error) {
        if (error.message.includes("Ya existe un producto con el código")) {
            return res.status(409).json({ error: error.message });
        }
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const updateProducto = async (req, res) => {
    const { roles_autorizados } = req.body;
    const errors = [];

    if (roles_autorizados) {
        const rolesArray = roles_autorizados.split(',').map(role => role.trim());
        for (const role of rolesArray) {
            if (!roles.includes(role)) {
                errors.push(`El rol especificado '${role}' no es válido.`);
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const { id } = req.params;
        const productoActualizado = await productoService.updateProducto(id, req.body);
        if (!productoActualizado) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.status(200).json(productoActualizado);
    } catch (error) {
        if (error.message.includes("Ya existe un producto con el código")) {
            return res.status(409).json({ error: error.message });
        }
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await productoService.deleteProducto(id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.status(200).json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        if (error.message.includes("No se puede eliminar el producto")) {
            return res.status(409).json({ error: error.message });
        }
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const filterProductos = async (req, res) => {
    try {
        const { limit, page } = req.params;
        const filterCriteria = req.body;

        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);

        if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
            return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
        }

        const offset = (pageNum - 1) * limitNum;

        const { rows: productos, count: total } = await productoService.filterProductosPaginated(filterCriteria, limitNum, offset);

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            data: productos,
            pagination: {
                total,
                currentPage: pageNum,
                limit: limitNum,
                totalPages
            }
        });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

module.exports = {
    getAllProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto,
    filterProductos,
};
