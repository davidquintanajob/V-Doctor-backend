const { Venta, formasDePago } = require('../models/venta');
const { Cliente } = require('../models/cliente');
const { Consulta } = require('../models/consulta');
const { ServicioComplejo } = require('../models/servicio_complejo');
const { Comerciable } = require('../models/comerciable');
const { Usuario } = require('../models/usuario');
const { Producto } = require('../models/producto');
const { Servicio } = require('../models/servicio');
const { Medicamento } = require('../models/medicamento');
const { Paciente } = require('../models/paciente');
const { VentaUsuario } = require('../models/venta_usuario');
const sequelize = require('../helpers/database');
const { FotoServicioComplejo } = require('../models/foto_servicio_complejo');
const fs = require('fs').promises;
const path = require('path');

const getAllVentas = async () => {
  try {
    const ventas = await Venta.findAll({
      include: [
        { model: Cliente, required: false },
        { model: Consulta, required: false, include: [{ model: Paciente, required: false }] },
        { model: Usuario, required: false },
        { model: Comerciable, required: false, include: [
          { model: Servicio, required: false },
          { model: Producto, required: false, include: [{ model: Medicamento, required: false }] }
        ] },
        { model: ServicioComplejo, required: false, include: [{ model: Servicio, required: false }] }
      ]
    });
    return ventas;
  } catch (error) {
    throw error;
  }
};

const getVentaById = async (id) => {
  try {
    const venta = await Venta.findOne({
      where: { id_venta: id },
      include: [
        { model: Cliente, required: false },
        { model: Consulta, required: false, include: [{ model: Paciente, required: false }] },
        { model: Usuario, required: false },
        { model: Comerciable, required: false, include: [
          { model: Servicio, required: false },
          { model: Producto, required: false, include: [{ model: Medicamento, required: false }] }
        ] },
        { model: ServicioComplejo, required: false, include: [{ model: Servicio, required: false }] }
      ]
    });
    return venta;
  } catch (error) {
    throw error;
  }
};

const validateForeignIds = async ({ id_cliente, id_consulta, id_servicio_complejo, id_comerciable, id_usuario }) => {
  const errors = [];

  // Validar que los IDs sean números positivos si se proporcionan
  if (id_cliente !== undefined && id_cliente !== null) {
    if (isNaN(id_cliente) || parseInt(id_cliente) <= 0) {
      errors.push('id_cliente debe ser un número positivo válido');
    } else {
      const cliente = await Cliente.findByPk(id_cliente);
      if (!cliente) errors.push(`Cliente con id ${id_cliente} no encontrado`);
    }
  }

  if (id_consulta !== undefined && id_consulta !== null) {
    if (isNaN(id_consulta) || parseInt(id_consulta) <= 0) {
      errors.push('id_consulta debe ser un número positivo válido');
    } else {
      const consulta = await Consulta.findByPk(id_consulta);
      if (!consulta) errors.push(`Consulta con id ${id_consulta} no encontrada`);
    }
  }

  if (id_servicio_complejo !== undefined && id_servicio_complejo !== null) {
    if (isNaN(id_servicio_complejo) || parseInt(id_servicio_complejo) <= 0) {
      errors.push('id_servicio_complejo debe ser un número positivo válido');
    } else {
      const sc = await ServicioComplejo.findByPk(id_servicio_complejo);
      if (!sc) errors.push(`Servicio complejo con id ${id_servicio_complejo} no encontrado`);
    }
  }

  if (id_comerciable !== undefined && id_comerciable !== null) {
    if (isNaN(id_comerciable) || parseInt(id_comerciable) <= 0) {
      errors.push('id_comerciable debe ser un número positivo válido');
    } else {
      const c = await Comerciable.findByPk(id_comerciable);
      if (!c) errors.push(`Comerciable con id ${id_comerciable} no encontrado`);
    }
  }

  if (id_usuario && Array.isArray(id_usuario)) {
    const invalidIds = [];
    const notFoundIds = [];
    for (const uId of id_usuario) {
      if (isNaN(uId) || parseInt(uId) <= 0) {
        invalidIds.push(uId);
      } else {
        const user = await Usuario.findByPk(uId);
        if (!user) notFoundIds.push(uId);
      }
    }
    if (invalidIds.length > 0) {
      errors.push(`IDs de usuario inválidos: ${invalidIds.join(', ')}`);
    }
    if (notFoundIds.length > 0) {
      errors.push(`Usuarios no encontrados: ${notFoundIds.join(', ')}`);
    }
  }

  return errors;
};

// Validar que todos los usuarios tengan rol autorizado en el comerciable
const validateUsuariosRolesAutorizados = async (id_comerciable, usuarios) => {
  if (!id_comerciable || !usuarios || !Array.isArray(usuarios) || usuarios.length === 0) {
    return [];
  }

  const errors = [];
  const comerciable = await Comerciable.findByPk(id_comerciable, {
    include: [
      { model: Producto, required: false },
      { model: Servicio, required: false }
    ]
  });

  if (!comerciable) return errors; // Ya fue validado en validateForeignIds

  // Si no hay roles_autorizados, cualquiera puede vender
  if (!comerciable.roles_autorizados || comerciable.roles_autorizados.trim() === '') {
    return [];
  }

  const rolesAutorizados = comerciable.roles_autorizados.split(',').map(r => r.trim());
  
  for (const userId of usuarios) {
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) continue; // Ya fue validado en validateForeignIds

    if (!rolesAutorizados.includes(usuario.rol)) {
      // Determinar nombre del comerciable (producto o servicio)
      let nombreComercial = 'producto/servicio desconocido';
      if (comerciable.producto && comerciable.producto.nombre) {
        nombreComercial = `producto "${comerciable.producto.nombre}"`;
      } else if (comerciable.servicio && comerciable.servicio.nombre) {
        nombreComercial = `servicio "${comerciable.servicio.nombre}"`;
      }
      
      errors.push(`Usuario "${usuario.nombre_usuario}" con rol "${usuario.rol}" no está autorizado a vender ${nombreComercial} (roles autorizados: ${rolesAutorizados.join(', ')})`);
    }
  }

  return errors;
};

// Validar cantidad de producto disponible
const validateProductoQuantity = async (id_comerciable, cantidadVenta) => {
  if (!id_comerciable) return { valid: true };

  const comerciable = await Comerciable.findByPk(id_comerciable, {
    include: [{ model: Producto, required: false }]
  });

  if (!comerciable || !comerciable.producto) {
    // No es un producto, no hay validación de cantidad
    return { valid: true };
  }

  const producto = comerciable.producto;
  const cantidadDisponible = producto.cantidad;

  if (cantidadVenta > cantidadDisponible) {
    return {
      valid: false,
      error: `No hay cantidad suficiente del producto "${producto.nombre}". Disponible: ${cantidadDisponible}, Solicitado: ${cantidadVenta}`
    };
  }

  return { valid: true };
};

// ============= MÉTODOS DE VALIDACIÓN =============

const validateCreate = async (ventaData) => {
  const errors = [];

  // Validar campos obligatorios
  const requiredFields = ['fecha', 'precio_original_comerciable_cup', 'precio_original_comerciable_usd', 'cantidad', 'precio_cobrado_cup', 'forma_pago'];
  const missing = requiredFields.filter(f => ventaData[f] === undefined || ventaData[f] === null || ventaData[f] === '');
  if (missing.length > 0) {
    errors.push(`Faltan campos obligatorios: ${missing.join(', ')}`);
  }

  // Validar que id_usuario es obligatorio y es un array
  if (!ventaData.id_usuario || !Array.isArray(ventaData.id_usuario) || ventaData.id_usuario.length === 0) {
    errors.push('El usuario es obligatorio y debe ser al menos 1 usuario');
  }

  // Validar que valores numéricos no sean negativos
  const numericFields = ['cantidad', 'precio_original_comerciable_cup', 'precio_original_comerciable_usd', 'costo_producto_cup', 'precio_cobrado_cup'];
  for (const field of numericFields) {
    if (ventaData[field] !== undefined && ventaData[field] !== null && parseFloat(ventaData[field]) < 0) {
      errors.push(`${field} no puede ser negativo`);
    }
  }

  // Validar forma_pago
  if (ventaData.forma_pago && !formasDePago.includes(ventaData.forma_pago)) {
    errors.push(`Forma de pago inválida. Opciones: ${formasDePago.join(', ')}`);
  }

  // Validar ForeignKeys
  const fkErrors = await validateForeignIds(ventaData);
  errors.push(...fkErrors);

  // Validar roles autorizados en comerciable
  if (ventaData.id_comerciable && (!errors.some(e => e.includes('Usuarios no encontrados')))) {
    const rolesErrors = await validateUsuariosRolesAutorizados(ventaData.id_comerciable, ventaData.id_usuario);
    errors.push(...rolesErrors);
  }

  // Validar cantidad de producto disponible
  if (ventaData.id_comerciable && (!errors.some(e => e.includes('No hay cantidad suficiente')))) {
    const quantityCheck = await validateProductoQuantity(ventaData.id_comerciable, ventaData.cantidad);
    if (!quantityCheck.valid) {
      errors.push(quantityCheck.error);
    }
  }

  // Validar imagenes_servicio_complejo si el comerciable es un servicio complejo
  if (ventaData.id_comerciable) {
    const isSC = await ServicioComplejo.findByPk(ventaData.id_comerciable);
    if (isSC) {
      const imgs = ventaData.imagenes_servicio_complejo;
      if (imgs !== undefined && imgs !== null) {
        if (!Array.isArray(imgs)) {
          errors.push('imagenes_servicio_complejo debe ser un arreglo');
        } else {
          for (const [idx, imgObj] of imgs.entries()) {
            if (!imgObj || !imgObj.imagen) {
              errors.push(`imagenes_servicio_complejo[${idx}].imagen es obligatorio para servicios complejos`);
            }
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

const validateUpdate = async (id, ventaData) => {
  const errors = [];

  // Validar que venta existe
  const venta = await Venta.findByPk(id);
  if (!venta) {
    errors.push(`Venta con id ${id} no encontrada`);
    return { valid: false, errors };
  }

  // Validar forma_pago si se proporciona
  if (ventaData.forma_pago && !formasDePago.includes(ventaData.forma_pago)) {
    errors.push(`Forma de pago inválida. Opciones: ${formasDePago.join(', ')}`);
  }

  // Validar que valores numéricos no sean negativos
  const numericFields = ['cantidad', 'precio_original_comerciable_cup', 'precio_original_comerciable_usd', 'costo_producto_cup', 'precio_cobrado_cup'];
  for (const field of numericFields) {
    if (ventaData[field] !== undefined && ventaData[field] !== null && parseFloat(ventaData[field]) < 0) {
      errors.push(`${field} no puede ser negativo`);
    }
  }

  // Validar id_usuario si se proporciona
  if (ventaData.id_usuario !== undefined) {
    if (!Array.isArray(ventaData.id_usuario) || ventaData.id_usuario.length === 0) {
      errors.push('id_usuario debe ser un array con al menos 1 usuario');
    }
  }

  // Validar ForeignKeys
  const fkErrors = await validateForeignIds(ventaData);
  errors.push(...fkErrors);

  // Si hay errores de validación básica, retornar antes de validaciones complejas
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validar roles autorizados
  const id_comerciable_check = ventaData.id_comerciable !== undefined ? ventaData.id_comerciable : venta.id_comerciable;
  const usuarios_check = ventaData.id_usuario !== undefined ? ventaData.id_usuario : await venta.getUsuarios().then(u => u.map(x => x.id_usuario));
  
  if (id_comerciable_check && usuarios_check.length > 0) {
    const rolesErrors = await validateUsuariosRolesAutorizados(id_comerciable_check, usuarios_check);
    errors.push(...rolesErrors);
  }

  // Validar cantidad de producto disponible
  if (ventaData.id_comerciable || ventaData.cantidad !== undefined) {
    const id_comerciable_validation = ventaData.id_comerciable !== undefined ? ventaData.id_comerciable : venta.id_comerciable;
    const cantidad_validation = ventaData.cantidad !== undefined ? ventaData.cantidad : venta.cantidad;
    
    const quantityCheck = await validateProductoQuantity(id_comerciable_validation, cantidad_validation);
    if (!quantityCheck.valid) {
      errors.push(quantityCheck.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

const validateDelete = async (id) => {
  const errors = [];

  const venta = await Venta.findByPk(id);
  if (!venta) {
    errors.push(`Venta con id ${id} no encontrada`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

const validateUpdateUsuarios = async (id_venta, usuarios) => {
  const errors = [];

  // Validar que usuarios es array con al menos 1 item
  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    errors.push('usuarios debe ser un array con al menos 1 usuario');
    return { valid: false, errors };
  }

  // Validar que venta existe
  const venta = await Venta.findByPk(id_venta);
  if (!venta) {
    errors.push(`Venta con id ${id_venta} no encontrada`);
    return { valid: false, errors };
  }

  // Validar que todos los usuarios existen
  for (const uId of usuarios) {
    if (isNaN(uId) || parseInt(uId) <= 0) {
      errors.push(`ID de usuario inválido: ${uId}`);
    } else {
      const user = await Usuario.findByPk(uId);
      if (!user) errors.push(`Usuario con id ${uId} no encontrado`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validar roles autorizados en comerciable
  if (venta.id_comerciable) {
    const rolesErrors = await validateUsuariosRolesAutorizados(venta.id_comerciable, usuarios);
    errors.push(...rolesErrors);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
};

// ============= MÉTODOS DE EJECUCIÓN =============

const createVenta = async (ventaData) => {
  const t = await sequelize.transaction();
  try {
    const usuarios = ventaData.id_usuario;
    // Separar imagenes (si vienen)
    const imagenesList = ventaData.imagenes_servicio_complejo;

    // Crear venta excluyendo id_usuario y las imagenes (tabla pivot)
    const toCreate = { ...ventaData };
    delete toCreate.id_usuario;
    delete toCreate.imagenes_servicio_complejo;

    const newVenta = await Venta.create(toCreate, { transaction: t });

    // Si es producto, restar cantidad
    if (ventaData.id_comerciable) {
      const comerciable = await Comerciable.findByPk(ventaData.id_comerciable, {
        include: [{ model: Producto, required: false }],
        transaction: t
      });

      if (comerciable && comerciable.producto) {
        const nuevaCantidad = comerciable.producto.cantidad - ventaData.cantidad;
        await comerciable.producto.update({ cantidad: nuevaCantidad }, { transaction: t });
      }
    }

    // Asociar usuarios
    const bulk = usuarios.map(uId => ({ id_venta: newVenta.id_venta, id_usuario: uId }));
    await VentaUsuario.bulkCreate(bulk, { transaction: t });

    // Si el comerciable es un servicio complejo y vienen imagenes, crearlas
    if (imagenesList && Array.isArray(imagenesList) && newVenta.id_comerciable) {
      const isSC = await ServicioComplejo.findByPk(newVenta.id_comerciable, { transaction: t });
      if (isSC) {
        const FOTOS_CARPETA_SERVICIO_COMPLEJO = process.env.FOTOS_CARPETA_SERVICIO_COMPLEJO || "fotos/servicio_complejo";
        const dirPath = path.join(__dirname, '..', FOTOS_CARPETA_SERVICIO_COMPLEJO);
        await fs.mkdir(dirPath, { recursive: true });

        for (const imgObj of imagenesList) {
          const imagen = imgObj.imagen;
          const nota = imgObj.nota || null;
          const newFoto = await FotoServicioComplejo.create({ ruta: '', nota, id_venta: newVenta.id_venta }, { transaction: t });
          const fileName = `${newVenta.id_comerciable}_${newFoto.id_foto_servicio_complejo}.jpg`;
          const imagePath = path.join(FOTOS_CARPETA_SERVICIO_COMPLEJO, fileName);
          await fs.writeFile(path.join(__dirname, '..', imagePath), Buffer.from(imagen, 'base64'));
          await newFoto.update({ ruta: imagePath }, { transaction: t });
        }
      }
    }

    await t.commit();
    return await getVentaById(newVenta.id_venta);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const updateVenta = async (id, ventaData) => {
  const t = await sequelize.transaction();
  try {
    const venta = await Venta.findByPk(id, { transaction: t });
    if (!venta) {
      await t.rollback();
      return null;
    }

    const usuarios = ventaData.id_usuario !== undefined ? ventaData.id_usuario : undefined;
    const toUpdate = { ...ventaData };
    delete toUpdate.id_usuario;
    const imagenesList = toUpdate.imagenes_servicio_complejo;
    delete toUpdate.imagenes_servicio_complejo;

    // Manejar cambios de cantidad y comerciable
    if (ventaData.cantidad !== undefined && ventaData.cantidad !== venta.cantidad) {
      const diferencia = ventaData.cantidad - venta.cantidad;
      const id_comerciable_current = ventaData.id_comerciable !== undefined ? ventaData.id_comerciable : venta.id_comerciable;
      
      const comerciable = await Comerciable.findByPk(id_comerciable_current, {
        include: [{ model: Producto, required: false }],
        transaction: t
      });

      if (comerciable && comerciable.producto) {
        const nuevaCantidad = comerciable.producto.cantidad - diferencia;
        await comerciable.producto.update({ cantidad: nuevaCantidad }, { transaction: t });
      }
    }

    // Si cambia el comerciable, restituir el anterior
    if (ventaData.id_comerciable !== undefined && ventaData.id_comerciable !== venta.id_comerciable) {
      const comerciableAnterior = await Comerciable.findByPk(venta.id_comerciable, {
        include: [{ model: Producto, required: false }],
        transaction: t
      });
      if (comerciableAnterior && comerciableAnterior.producto) {
        const cantidadRestituida = comerciableAnterior.producto.cantidad + venta.cantidad;
        await comerciableAnterior.producto.update({ cantidad: cantidadRestituida }, { transaction: t });
      }
    }

    await venta.update(toUpdate, { transaction: t });

    if (usuarios !== undefined) {
      // Reemplazar asociaciones
      await VentaUsuario.destroy({ where: { id_venta: id }, transaction: t });
      const bulk = usuarios.map(uId => ({ id_venta: id, id_usuario: uId }));
      await VentaUsuario.bulkCreate(bulk, { transaction: t });
    }

    // Manejar imagenes si se proporcionaron (solo si la venta actual o la nueva referencia es servicio complejo)
    if (imagenesList !== undefined) {
      const idComerciableEffective = toUpdate.id_comerciable !== undefined ? toUpdate.id_comerciable : venta.id_comerciable;
      const isSC = idComerciableEffective ? await ServicioComplejo.findByPk(idComerciableEffective, { transaction: t }) : null;
      if (isSC) {
        // eliminar fotos existentes
        const existingFotos = await FotoServicioComplejo.findAll({ where: { id_venta: id }, transaction: t });
        for (const f of existingFotos) {
          if (f.ruta) {
            try { await fs.unlink(path.join(__dirname, '..', f.ruta)); } catch (e) { console.error('unlink error', e); }
          }
          await f.destroy({ transaction: t });
        }

        // crear nuevas fotos
        const FOTOS_CARPETA_SERVICIO_COMPLEJO = process.env.FOTOS_CARPETA_SERVICIO_COMPLEJO || "fotos/servicio_complejo";
        const dirPath = path.join(__dirname, '..', FOTOS_CARPETA_SERVICIO_COMPLEJO);
        await fs.mkdir(dirPath, { recursive: true });

        for (const imgObj of imagenesList) {
          const imagen = imgObj.imagen;
          const nota = imgObj.nota || null;
          const newFoto = await FotoServicioComplejo.create({ ruta: '', nota, id_venta: id }, { transaction: t });
          const fileName = `${idComerciableEffective}_${newFoto.id_foto_servicio_complejo}.jpg`;
          const imagePath = path.join(FOTOS_CARPETA_SERVICIO_COMPLEJO, fileName);
          await fs.writeFile(path.join(__dirname, '..', imagePath), Buffer.from(imagen, 'base64'));
          await newFoto.update({ ruta: imagePath }, { transaction: t });
        }
      } else {
        // Si no es servicio complejo, ignorar la lista (según requisito)
      }
    }

    await t.commit();
    return await getVentaById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const deleteVenta = async (id) => {
  const t = await sequelize.transaction();
  try {
    const venta = await Venta.findByPk(id, { transaction: t });
    if (!venta) {
      await t.rollback();
      return false;
    }

    // Si el comerciable es un producto, devolver la cantidad al inventario
    if (venta.id_comerciable) {
      const comerciable = await Comerciable.findByPk(venta.id_comerciable, {
        include: [{ model: Producto, required: false }],
        transaction: t
      });

      if (comerciable && comerciable.producto) {
        const producto = comerciable.producto;
        const nuevaCantidad = (producto.cantidad || 0) + (venta.cantidad || 0);
        await producto.update({ cantidad: nuevaCantidad }, { transaction: t });
      }
    }

    // Eliminar asociaciones pivot
    await VentaUsuario.destroy({ where: { id_venta: id }, transaction: t });
    // Eliminar fotos asociadas a esta venta (y archivos)
    const fotos = await FotoServicioComplejo.findAll({ where: { id_venta: id }, transaction: t });
    for (const f of fotos) {
      if (f.ruta) {
        try { await fs.unlink(path.join(__dirname, '..', f.ruta)); } catch (e) { console.error('unlink error', e); }
      }
      await f.destroy({ transaction: t });
    }
    // Eliminar la venta
    await venta.destroy({ transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const filterVentasPaginated = async (filterCriteria, limit, offset) => {
  try {
    const whereClause = {};
    const include = [
      { model: Cliente, required: false },
      { model: Consulta, required: false, include: [{ model: Paciente, required: false }] },
      { model: Usuario, required: false },
      { model: Comerciable, required: false, include: [
        { model: Servicio, required: false },
        { model: Producto, required: false, include: [{ model: Medicamento, required: false }] }
      ] },
      { model: ServicioComplejo, required: false, include: [{ model: Servicio, required: false }] }
    ];

    // Filtro detallado: por defecto true, si es false incluye ventas sin servicio_complejo
    const detallado = filterCriteria && filterCriteria.detallado !== undefined ? filterCriteria.detallado : true;
    if (!detallado) {
      // Si detallado es false, incluir ventas con id_servicio_complejo null
      whereClause[require('sequelize').Op.or] = [
        { id_servicio_complejo: null }
      ];
    }
    delete filterCriteria.detallado;

    // Filtro por tipo de comerciable: Producto (productos que NO sean medicamentos), Medicamento
    // Servicio (servicios que no sean servicio complejo) y Servicio Complejo
    const tipoComerciableRaw = filterCriteria && filterCriteria.tipo_comerciable ? String(filterCriteria.tipo_comerciable).toLowerCase().trim() : null;
    // No eliminar aún: lo procesamos después de obtener resultados

    // Filtros de fecha (rango)
    if (filterCriteria && filterCriteria.fecha_desde && filterCriteria.fecha_hasta) {
      whereClause.fecha = {
        [require('sequelize').Op.between]: [new Date(filterCriteria.fecha_desde), new Date(filterCriteria.fecha_hasta)]
      };
      delete filterCriteria.fecha_desde;
      delete filterCriteria.fecha_hasta;
    } else if (filterCriteria && filterCriteria.fecha_desde) {
      whereClause.fecha = { [require('sequelize').Op.gte]: new Date(filterCriteria.fecha_desde) };
      delete filterCriteria.fecha_desde;
    } else if (filterCriteria && filterCriteria.fecha_hasta) {
      whereClause.fecha = { [require('sequelize').Op.lte]: new Date(filterCriteria.fecha_hasta) };
      delete filterCriteria.fecha_hasta;
    }

    // Filtros de precio (min/max)
    const priceFields = [
      'precio_original_comerciable_cup',
      'precio_original_comerciable_usd',
      'costo_producto_cup',
      'precio_cobrado_cup'
    ];
    
    for (const field of priceFields) {
      const minKey = `${field}_min`;
      const maxKey = `${field}_max`;
      
      if (filterCriteria && (filterCriteria[minKey] || filterCriteria[maxKey])) {
        whereClause[field] = {};
        if (filterCriteria[minKey]) {
          whereClause[field][require('sequelize').Op.gte] = parseFloat(filterCriteria[minKey]);
          delete filterCriteria[minKey];
        }
        if (filterCriteria[maxKey]) {
          whereClause[field][require('sequelize').Op.lte] = parseFloat(filterCriteria[maxKey]);
          delete filterCriteria[maxKey];
        }
      }
    }

    // Filtro por nombre de usuario
    if (filterCriteria && filterCriteria.nombre_usuario) {
      include[2].where = { nombre_usuario: { [require('sequelize').Op.iLike]: `%${filterCriteria.nombre_usuario}%` } };
      include[2].required = true;
      delete filterCriteria.nombre_usuario;
    }

    // Filtro por nombre de cliente
    if (filterCriteria && filterCriteria.nombre_cliente) {
      include[0].where = { nombre: { [require('sequelize').Op.iLike]: `%${filterCriteria.nombre_cliente}%` } };
      include[0].required = true;
      delete filterCriteria.nombre_cliente;
    }

    // Filtro por nombre de producto (pivota por comerciable)
    if (filterCriteria && filterCriteria.nombre_producto) {
      include[4].include[1].where = { nombre: { [require('sequelize').Op.iLike]: `%${filterCriteria.nombre_producto}%` } };
      include[4].include[1].required = true;
      include[4].required = true;
      delete filterCriteria.nombre_producto;
    }

    // Filtro por descripción de servicio (pivota por comerciable)
    if (filterCriteria && filterCriteria.descripcion_servicio) {
      include[4].include[0].where = { descripcion: { [require('sequelize').Op.iLike]: `%${filterCriteria.descripcion_servicio}%` } };
      include[4].include[0].required = true;
      include[4].required = true;
      delete filterCriteria.descripcion_servicio;
    }

    // Filtro por nombre de paciente (pivota por consulta)
    if (filterCriteria && filterCriteria.nombre_paciente) {
      include[1].include[0].where = { nombre: { [require('sequelize').Op.iLike]: `%${filterCriteria.nombre_paciente}%` } };
      include[1].include[0].required = true;
      include[1].required = true;
      delete filterCriteria.nombre_paciente;
    }

    // Filtros generales (cantidad, nota, forma_pago)
    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        if (filterCriteria[key] === undefined || filterCriteria[key] === null) continue;
        whereClause[key] = { [require('sequelize').Op.iLike]: `%${String(filterCriteria[key]).toLowerCase()}%` };
      }
    }

    const result = await Venta.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include,
      distinct: true
    });

    // Si se proporcionó tipo_comerciable, filtramos los rows en memoria (mismo patrón usado en otros servicios)
    if (tipoComerciableRaw) {
      let filtered = result.rows;

      if (tipoComerciableRaw === 'producto') {
        // Producto = tiene producto y NO tiene medicamento asociado
        filtered = filtered.filter(v => v.comerciable && v.comerciable.producto && !v.comerciable.producto.medicamento);
      } else if (tipoComerciableRaw === 'medicamento' || tipoComerciableRaw === 'medicamneto') {
        // Medicamento = producto con medicamento asociado
        filtered = filtered.filter(v => v.comerciable && v.comerciable.producto && !!v.comerciable.producto.medicamento);
      } else if (tipoComerciableRaw === 'servicio') {
        // Servicio = tiene comerciable.servicio y NO es servicio complejo
        filtered = filtered.filter(v => v.comerciable && v.comerciable.servicio && !v.servicio_complejo);
      } else if (tipoComerciableRaw === 'servicio complejo' || tipoComerciableRaw === 'serviciocomplejo' || tipoComerciableRaw === 'servicio_complejo') {
        // Servicio Complejo = ventas asociadas a servicio complejo
        filtered = filtered.filter(v => !!v.servicio_complejo);
      }

      result.count = filtered.length;
      result.rows = filtered;
    }

    return result;
  } catch (error) {
    throw error;
  }
};

const updateVentaUsuarios = async (id_venta, usuarios) => {
  const t = await sequelize.transaction();
  try {
    // Reemplazar las asociaciones
    await VentaUsuario.destroy({ where: { id_venta: id_venta }, transaction: t });
    const bulk = usuarios.map(uId => ({ id_venta: id_venta, id_usuario: uId }));
    await VentaUsuario.bulkCreate(bulk, { transaction: t });

    await t.commit();
    return await getVentaById(id_venta);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

const getVentasByPacienteAndTipoMedicamento = async (pacienteId, tipoMedicamento) => {
  try {
    const ventas = await Venta.findAll({
      include: [
        { model: Consulta, required: true, include: [{ model: Paciente, required: true, where: { id_paciente: pacienteId } }] },
        { model: Comerciable, required: true, include: [
          { model: Producto, required: true, include: [{ model: Medicamento, required: true, where: { tipo_medicamento: tipoMedicamento } }] },
          { model: Servicio, required: false }
        ] },
        { model: Cliente, required: false },
        { model: Usuario, required: false },
        { model: ServicioComplejo, required: false }
      ]
    });
    return ventas;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta,
  filterVentasPaginated,
  updateVentaUsuarios,
  getVentasByPacienteAndTipoMedicamento,
  validateCreate,
  validateUpdate,
  validateDelete,
  validateUpdateUsuarios,
};
