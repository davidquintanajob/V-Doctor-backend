/* global process */
const usuarioService = require('../services/usuarioService');
const bcrypt = require('bcrypt');
const { roles, Usuario } = require("../models/usuario");
const jwt = require("jsonwebtoken");
const { getIO } = require('../helpers/socket');

const getAllUsuarios = async (req, res) => {
    try {
        const usuarios = await usuarioService.getAllUsuarios();
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await usuarioService.getUsuarioById(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json(usuario);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const createUsuario = async (req, res) => {
    const { nombre_natural, nombre_usuario, contrasenna, rol, salario_diario, activo, imagen } = req.body;
    const errors = [];

    // Validar campos requeridos
    if (!nombre_natural || !nombre_usuario || !contrasenna || !rol) {
        errors.push("Todos los campos son obligatorios: nombre natural, nombre de usuario, contrasenna, rol");
    }
    // Validar formato del nombre
    if (nombre_natural) {
        if (nombre_natural.length < 3 || nombre_natural.length > 50) {
            errors.push("El nombre debe tener entre 3 y 50 caracteres");
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre_natural)) {
            errors.push("El nombre solo puede contener letras y espacios");
        }
    }
    // Validar rol
    if (rol) {
        const rolesValidos = roles;
        if (!rolesValidos.includes(rol)) {
            errors.push(`El rol especificado no es válido. Roles válidos: ${rolesValidos.join(", ")}`);
        }
    }
    // Validar formato del nombre de usuario
    if (nombre_usuario) {
        if (nombre_usuario.length < 4 || nombre_usuario.length > 20) {
            errors.push("El nombre de usuario debe tener entre 4 y 20 caracteres");
        }
        if (!/^[a-zA-Z0-9_]+$/.test(nombre_usuario)) {
            errors.push("El nombre de usuario solo puede contener letras, números y guiones bajos");
        }
    }
    // Validar formato de la contraseña
    if (contrasenna) {
        if (contrasenna.length < 6) {
            errors.push("La contraseña debe tener al menos 6 caracteres");
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(contrasenna)) {
            errors.push("La contraseña debe contener al menos una letra mayúscula, una minúscula y un número");
        }
    }
    // Si hay errores de validación, retornarlos todos juntos
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }
    // Verificar si el nombre de usuario ya existe
    try {
        const usuarioExists = await usuarioService.usuarioExists(nombre_usuario);
        if (usuarioExists) {
            return res.status(400).json({ errors: [`Ya existe un usuario con el nombre de usuario: ${nombre_usuario}`] });
        }
    } catch (error) {
        console.error("Error al verificar el nombre de usuario:", error);
        const status = error.status || 500;
        const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear el usuario'];
        return res.status(status).json({ errors: errs });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(contrasenna, 10);

    const usuarioData = {
        nombre_natural: nombre_natural,
        nombre_usuario: nombre_usuario,
        contrasenna: hashedPassword,
        rol: rol,
        activo: activo !== undefined ? activo : true,
        salario_diario: salario_diario || 0,
        imagen
    };
    try {
        const newUsuario = await usuarioService.createUsuario(usuarioData);
        return res.status(201).json({
            message: "Usuario creado exitosamente",
            data: {
                id_usuario: newUsuario.id_usuario,
                nombre: newUsuario.nombre,
                nombre_usuario: newUsuario.nombre_usuario,
                cargo: newUsuario.cargo,
                rol: newUsuario.rol,
                activo: newUsuario.activo,
                carnet_identidad: newUsuario.carnet_identidad
            }
        });
    } catch (error) {
        console.error("Error al crear el usuario:", error);
        const status = error.status || 500;
        const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al crear el usuario'];
        return res.status(status).json({ errors: errs });
    }
};

const updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_natural, nombre_usuario, contrasenna, rol, salario_diario, activo, imagen } = req.body;
        const errors = [];

        // Validar que al menos un campo esté presente
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ errors: ["Se debe proporcionar al menos un campo para actualizar"] });
        }

        // Validaciones
        if (nombre_natural) {
            if (nombre_natural.length < 3 || nombre_natural.length > 50) {
                errors.push("El nombre debe tener entre 3 y 50 caracteres");
            }
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre_natural)) {
                errors.push("El nombre solo puede contener letras y espacios");
            }
        }
        if (rol) {
            const rolesValidos = roles;
            if (!rolesValidos.includes(rol)) {
                errors.push(`El rol especificado no es válido. Roles válidos: ${rolesValidos.join(", ")}`);
            }
        }
        if (nombre_usuario) {
            if (nombre_usuario.length < 4 || nombre_usuario.length > 20) {
                errors.push("El nombre de usuario debe tener entre 4 y 20 caracteres");
            }
            if (!/^[a-zA-Z0-9_]+$/.test(nombre_usuario)) {
                errors.push("El nombre de usuario solo puede contener letras, números y guiones bajos");
            }
        }
        if (contrasenna) {
            if (contrasenna.length < 6) {
                errors.push("La contraseña debe tener al menos 6 caracteres");
            }
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(contrasenna)) {
                errors.push("La contraseña debe contener al menos una letra mayúscula, una minúscula y un número");
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        // Verificar si el nombre de usuario ya existe (y no es el usuario actual)
        if (nombre_usuario) {
            try {
                const usuarioActual = await usuarioService.getUsuarioById(id);
                if (usuarioActual.nombre_usuario !== nombre_usuario) {
                    const usuarioExists = await usuarioService.usuarioExists(nombre_usuario);
                    if (usuarioExists) {
                        return res.status(400).json({ errors: [`Ya existe un usuario con el nombre de usuario: ${nombre_usuario}`] });
                    }
                }
            } catch (error) {
                console.error("Error al verificar el nombre de usuario:", error);
                const status = error.status || 500;
                const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al actualizar el usuario'];
                return res.status(status).json({ errors: errs });
            }
        }

        const userData = {};
        if (nombre_natural) userData.nombre_natural = nombre_natural;
        if (nombre_usuario) userData.nombre_usuario = nombre_usuario;
        if (rol) userData.rol = rol;
        if (salario_diario) userData.salario_diario = salario_diario;
        if (activo !== undefined) userData.activo = activo;
        if (imagen) userData.imagen = imagen;
        if (contrasenna) {
            const hashedPassword = await bcrypt.hash(contrasenna, 10);
            userData.contrasenna = hashedPassword;
        }

        const usuarioActualizado = await usuarioService.updateUsuario(id, userData);
        if (!usuarioActualizado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json(usuarioActualizado);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const eliminado = await usuarioService.deleteUsuario(id);
        if (!eliminado) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, details: error.errors });
    }
};

const filterUsuarios = async (req, res) => {
    try {
        const { limit, page } = req.params;
        const filterCriteria = req.body;

        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);

        if (isNaN(limitNum) || limitNum <= 0 || isNaN(pageNum) || pageNum <= 0) {
            return res.status(400).json({ error: 'Limit y page deben ser números enteros positivos' });
        }

        const offset = (pageNum - 1) * limitNum;

        const { rows: usuarios, count: total } = await usuarioService.filterUsuariosPaginated(filterCriteria, limitNum, offset);

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            data: usuarios,
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

const login = async (req, res) => {
    const { nombre_usuario, contrasenna } = req.body;

    try {
        const usuario = await usuarioService.getUsuarioByNombreUsuario(nombre_usuario);
        if (!usuario) {
            return res.status(404).json({ errors: ["No se ha encontrado el usuario con el nombre de usuario pasado por parámetros."] });
        }

        const isValidPassword = await bcrypt.compare(contrasenna, usuario.contrasenna);
        if (!isValidPassword) {
            return res.status(401).json({ errors: ["Contraseña incorrecta"] });
        }

        const token = jwt.sign(
            {
                userId: usuario.id_usuario,
                nombre: usuario.nombre_natural,
                nombre_usuario: usuario.nombre_usuario,
                salario_diario: usuario.salario_diario,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        const refreshToken = jwt.sign({ userId: usuario.id_usuario }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '24h' });

        const respuesta = {
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre_natural,
                nombre_usuario: usuario.nombre_usuario,
                salario_diario: usuario.salario_diario,
                rol: usuario.rol
            },
            token: token,
            refreshToken
        };

        // Emitir evento de login por Socket.IO (útil para paneles en tiempo real)
        try {
            const io = getIO();
            io.emit('usuario:login', {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre_natural,
                nombre_usuario: usuario.nombre_usuario,
                salario_diario: usuario.salario_diario,
                rol: usuario.rol,
                fecha: new Date().toISOString(),
            });
        } catch (socketError) {
            console.error('Error al emitir evento de login por Socket.IO:', socketError.message);
        }

        return res.status(200).json(respuesta);
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        const status = error.status || 500;
        const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al iniciar sesión'];
        return res.status(status).json({ errors: errs });
    }
};

const changePassword = async (req, res) => {
    try {
        const { viejaContrasenna, nuevaContrasenna } = req.body || {};
        const errors = [];
        if (!viejaContrasenna) errors.push('viejaContrasenna es requerida');
        if (!nuevaContrasenna) errors.push('nuevaContrasenna es requerida');
        if (errors.length > 0) return res.status(400).json({ errors });

        // Obtener y verificar token del header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(403).json({ errors: ['Token no proporcionado'] });
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (errorVerify) {
            console.error('Error al verificar el token:', errorVerify);
            return res.status(403).json({ errors: ['Token inválido o expirado'] });
        }

        // En login se firma como userId; aceptar también id_usuario por compatibilidad
        const userId = decoded.userId || decoded.id_usuario;
        if (!userId) return res.status(403).json({ errors: ['Token sin userId válido'] });

        // Buscar usuario con su contraseña (hash)
        const usuario = await Usuario.findOne({ where: { id_usuario: userId } });
        if (!usuario) return res.status(404).json({ errors: ['Usuario no encontrado'] });

        // Validar contraseña actual con bcrypt de forma estricta
        const storedHash = String(usuario.contrasenna || '');
        const oldPlain = String(viejaContrasenna || '');
        // Validar formato de hash bcrypt ($2a/$2b/$2y)
        const isBcryptHash = /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedHash);
        if (!isBcryptHash) {
            return res.status(500).json({ errors: ['Contraseña almacenada con formato inválido'] });
        }
        const ok = await bcrypt.compare(oldPlain, storedHash);
        if (ok !== true) {
            return res.status(401).json({ errors: ['Contraseña actual incorrecta'] });
        }

        // Solo si la contraseña actual es correcta, proceder a actualizar
        if (ok === true) {
            // Reglas mínimas para nueva contraseña (opcional: reflejar validaciones de create)
            if (String(nuevaContrasenna).length < 6) {
                return res.status(400).json({ errors: ['La nueva contraseña debe tener al menos 6 caracteres'] });
            }

            const hashed = await bcrypt.hash(String(nuevaContrasenna), 10);
            await usuario.update({ contrasenna: hashed });
            return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
        }
    } catch (error) {
        console.error('Error en changePassword:', error);
        const status = error.status || 500;
        const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al cambiar contraseña'];
        return res.status(status).json({ errors: errs });
    }
}

    module.exports = {
        getAllUsuarios,
        getUsuarioById,
        createUsuario,
        updateUsuario,
        deleteUsuario,
        filterUsuarios,
        login,
        changePassword
    };
