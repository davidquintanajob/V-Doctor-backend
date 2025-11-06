// controllers/usuarioController.js
/* global process */
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const usuarioService = require('../services/usuarioService');
const Usuario = require('../models/usuario');
/**
 * Obtener todos los usuarios
 */
const getUsuarios = async (req, res) => {
    try {
        // Obtener los usuarios desde el servicio
        const usuarios = await usuarioService.getAllUsuarios();

        // Verificar si hay usuarios
        if (!usuarios || usuarios.length === 0) {
          return res.status(200).json([]); // Retornar un array vacío si no hay usuarios
        }

        return res.status(200).json(usuarios); // Retornar la lista de usuarios
    } catch (error) {
        console.error("Error al obtener los usuarios:", error);
  const status = error.status || 500;
  const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al obtener los usuarios'];
  return res.status(status).json({ errors: errs });
    }
};

/**
 * Obtener un usuario por ID
 */
const getUsuarioById = async (req, res) => {
    const { id } = req.params; // Obtener el ID del usuario desde los parámetros
    try {
        const usuario = await usuarioService.getUsuarioById(id);

        // Verificar si el usuario fue encontrado
        if (!usuario) {
            return res.status(404).json({ errors: ["Usuario no encontrado"] });
        }

        return res.status(200).json(usuario); // Retornar el usuario encontrado
    } catch (error) {
        console.error("Error al obtener el usuario:", error);
  const status = error.status || 500;
  const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al obtener el usuario'];
  return res.status(status).json({ errors: errs });
    }
};

/**
 * Crear un nuevo usuario
 */
const createUsuario = async (req, res) => {
  const { nombre, nombre_usuario, cargo, contrasenna, rol, carnet_identidad } = req.body;
  const errors = [];

  // Validar campos requeridos
  if (!nombre || !nombre_usuario || !cargo || !contrasenna || !rol) {
    errors.push("Todos los campos son obligatorios: nombre, nombre_usuario, cargo, contrasenna, rol");
  }

  // Validar formato del nombre
  if (nombre) {
    if (nombre.length < 3 || nombre.length > 50) {
      errors.push("El nombre debe tener entre 3 y 50 caracteres");
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      errors.push("El nombre solo puede contener letras y espacios");
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

  // Validar formato del cargo
  if (cargo) {
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(cargo)) {
      errors.push("El cargo solo puede contener letras y espacios");
    }
  }

  // Validar formato de la contraseña
  if (contrasenna) {
    if (contrasenna.length < 8) {
      errors.push("La contraseña debe tener al menos 8 caracteres");
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(contrasenna)) {
      errors.push("La contraseña debe contener al menos una letra mayúscula, una minúscula y un número");
    }
  }

  // Validar rol
  if (rol) {
    const rolesValidos = ["Administrador", "Comercial", "Invitado"];
    if (!rolesValidos.includes(rol)) {
      errors.push("El rol debe ser uno de los siguientes: Administrador, Comercial, Invitado");
    }
  }

  // Validar carnet_identidad
  if (!carnet_identidad) {
    errors.push("El carnet_identidad es obligatorio y debe contener exactamente 11 dígitos numéricos");
  } else {
    if (!/^[0-9]{11}$/.test(carnet_identidad)) {
      errors.push("El carnet_identidad debe contener exactamente 11 dígitos numéricos");
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
    // Verificar si el carnet ya existe
    const carnetExists = await usuarioService.usuarioExistsByCarnet(carnet_identidad);
    if (carnetExists) {
      return res.status(400).json({ errors: [`Ya existe un usuario con el carnet_identidad: ${carnet_identidad}`] });
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
    nombre,
    nombre_usuario,
    cargo,
    contrasenna: hashedPassword,
    rol,
    carnet_identidad,
    activo: true
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

/**
 * Actualizar un usuario
 */
const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, nombre_usuario, cargo, contrasenna, rol, activo, carnet_identidad } = req.body;
  
    // Validar que se proporcione al menos un campo para actualizar
    if (!nombre && !nombre_usuario && !cargo && !contrasenna && !rol && !activo && !carnet_identidad) {
        return res.status(400).json({ errors: ["Se debe proporcionar al menos un campo para actualizar: nombre, nombre_usuario, cargo, contrasenna, rol, activo o carnet_identidad"] });
    }

    // Validar que el rol de usuario sea correcto
    if (rol !== "Administrador" && rol !== "Comercial" && rol !== "Invitado") {
      return res.status(400).json({ errors: ["El rol de usuario debe ser Administrador, Comercial o Invitado"] });
    }
    
    try {
      // Verificar si el usuario existe
      const usuario = await usuarioService.getUsuarioById(id);
      if (!usuario) {
  return res.status(404).json({ errors: ["Usuario no encontrado"] });
      }
  
      // Preparar los datos para la actualización
      const updatedUserData = {};
  
      // Actualizar cada campo solo si se proporciona
      if (nombre) {
        updatedUserData.nombre = nombre;
      }
  
      if (nombre_usuario) {
        // Verificar si el nuevo nombre de usuario ya existe
        const usuarioExists = await usuarioService.usuarioExists(nombre_usuario);
        if (usuarioExists && usuario.nombre_usuario !== nombre_usuario) {
          return res.status(400).json({ errors: [`Ya existe un usuario con el nombre de usuario: ${nombre_usuario}`] });
        }
        updatedUserData.nombre_usuario = nombre_usuario;
      }

      if (carnet_identidad) {
        // Verificar si el nuevo carnet ya existe
        const carnetExists = await usuarioService.usuarioExistsByCarnet(carnet_identidad);
        if (carnetExists && usuario.carnet_identidad !== carnet_identidad) {
          return res.status(400).json({ errors: [`Ya existe un usuario con el carnet_identidad: ${carnet_identidad}`] });
        }
        if (!/^[0-9]{11}$/.test(carnet_identidad)) {
    return res.status(400).json({ errors: ["El carnet_identidad debe contener exactamente 11 dígitos numéricos"] });
        }
        updatedUserData.carnet_identidad = carnet_identidad;
      }
  
      if (cargo) {
        updatedUserData.cargo = cargo;
      }
  
      if (contrasenna) {
        const hashedPassword = await bcrypt.hash(contrasenna, 10);
        updatedUserData.contrasenna = hashedPassword;
      }
  
      if (rol) {
        updatedUserData.rol = rol;
      }
  
      if (activo) {
        updatedUserData.activo = activo;
      }
  
      // Actualizar el usuario
      const updatedUsuario = await usuarioService.updateUsuario(id, updatedUserData);
      if (!updatedUsuario) {
  return res.status(500).json({ errors: ["No se pudo actualizar el usuario"] });
      }
  
      // Obtener el usuario actualizado
      const updatedUser = await usuarioService.getUsuarioById(id);
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
  const status = error.status || 500;
  const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al actualizar el usuario'];
  return res.status(status).json({ errors: errs });
    }
};

/**
 * Eliminar un usuario
 */
const deleteUsuario = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar si el usuario existe antes de intentar eliminarlo
        const usuario = await usuarioService.getUsuarioById(id);
        if (!usuario) {
      return res.status(404).json({ errors: ["Usuario no encontrado"] });
        }

        // Validar si tiene ofertas o facturas asociadas
        const relaciones = {};
        if (usuario.ofertas && usuario.ofertas.length > 0) {
          relaciones.ofertas = usuario.ofertas.map(o => ({ id_oferta: o.id_oferta, descripcion: o.descripcion }));
        }
        if (usuario.facturas && usuario.facturas.length > 0) {
          relaciones.facturas = usuario.facturas.map(f => ({ id_factura: f.id_factura, numero: f.numero }));
        }

        if (Object.keys(relaciones).length > 0) {
          return res.status(400).json({ errors: ["No se puede eliminar el usuario porque tiene relaciones con otros registros (ofertas/facturas)."], relaciones });
        }

        // Verificar si el usuario está activo
        if (!usuario.activo) {
      return res.status(400).json({ errors: ["El usuario ya está inactivo"] });
        }

        // Intentar eliminar el usuario
        const result = await usuarioService.deleteUsuario(id);
        
        if (!result) {
      return res.status(500).json({ errors: ["Error al eliminar el usuario"] });
        }

        return res.status(200).json({ 
            message: "Usuario eliminado exitosamente",
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                nombre_usuario: usuario.nombre_usuario
            }
        });
    } catch (error) {
    console.error("Error al eliminar el usuario:", error);
  const status = error.status || 500;
  const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al eliminar el usuario'];
  return res.status(status).json({ errors: errs });
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

    // Modificar el payload del token para incluir más datos del usuario
    const token = jwt.sign(
      {
        userId: usuario.id_usuario,
        nombre: usuario.nombre,
        nombre_usuario: usuario.nombre_usuario,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    const refreshToken = jwt.sign({ userId: usuario.id_usuario }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '24h' });

    // Modificar el objeto de respuesta
    const respuesta = {
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre, // Incluir nombre
        nombre_usuario: usuario.nombre_usuario,
        rol: usuario.rol // Incluir rol
        // Eliminar email si no es necesario en la respuesta
      },
      token: token,
      refreshToken
    };

    return res.status(200).json(respuesta);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
  const status = error.status || 500;
  const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al iniciar sesión'];
  return res.status(status).json({ errors: errs });
  }
};

/**
 * Filtrar usuarios por múltiples criterios
 */
const filterUsuarios = async (req, res) => {
  const { nombre, nombre_usuario, cargo, rol, carnet_identidad } = req.body;

  // Construir el objeto de criterios de filtro
  const filterCriteria = {};
  if (nombre) {
    filterCriteria.nombre = nombre;
  }
  if (nombre_usuario) {
    filterCriteria.nombre_usuario = nombre_usuario;
  }
  if (cargo) {
    filterCriteria.cargo = cargo;
  }
  if (rol) {
    filterCriteria.rol = rol;
  }
  if (carnet_identidad) {
    filterCriteria.carnet_identidad = carnet_identidad;
  }

  try {
    const usuariosFiltrados = await usuarioService.filterUsuarios(filterCriteria);
    return res.status(200).json(usuariosFiltrados);
  } catch (error) {
    console.error("Error al filtrar usuarios:", error);
  const status = error.status || 500;
  const errs = error.errors && Array.isArray(error.errors) ? error.errors : [error.message || 'Error al filtrar usuarios'];
  return res.status(status).json({ errors: errs });
  }
};

module.exports = {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    login,
    filterUsuarios,
    // Nuevo endpoint: cambiar contraseña
    changePassword: async (req, res) => {
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
    },
};