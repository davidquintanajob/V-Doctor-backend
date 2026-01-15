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
        {
          model: Comerciable, required: false, include: [
            { model: Servicio, required: false },
            { model: Producto, required: false, include: [{ model: Medicamento, required: false }] }
          ]
        },
        { model: ServicioComplejo, required: false, include: [{ model: Servicio, required: false }] }
        ,{ model: Venta, as: 'VentaRelacionada', required: false }
        ,{ model: Venta, as: 'VentasRelacionadas', required: false }
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
        {
          model: Comerciable, required: false, include: [
            { model: Servicio, required: false },
            { model: Producto, required: false, include: [{ model: Medicamento, required: false }] }
          ]
        },
        { model: ServicioComplejo, required: false, include: [{ model: Servicio, required: false }] }
        ,{ model: Venta, as: 'VentaRelacionada', required: false }
        ,{ model: Venta, as: 'VentasRelacionadas', required: false }
      ]
    });
    return venta;
  } catch (error) {
    throw error;
  }
};

const validateForeignIds = async ({ id_cliente, id_consulta, id_servicio_complejo, id_comerciable, id_usuario, id_venta_relacionada }) => {
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

  if (id_venta_relacionada !== undefined && id_venta_relacionada !== null) {
    if (isNaN(id_venta_relacionada) || parseInt(id_venta_relacionada) <= 0) {
      errors.push('id_venta_relacionada debe ser un número positivo válido');
    } else {
      const ventaRel = await Venta.findByPk(id_venta_relacionada);
      if (!ventaRel) errors.push(`Venta relacionada con id ${id_venta_relacionada} no encontrada`);
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

  // Validar que no se relacione a sí misma si se proporcionó id_venta_relacionada
  if (ventaData.id_venta_relacionada !== undefined && ventaData.id_venta_relacionada !== null) {
    if (!isNaN(ventaData.id_venta_relacionada) && parseInt(ventaData.id_venta_relacionada) === parseInt(id)) {
      errors.push('Una venta no puede relacionarse consigo misma');
      return { valid: false, errors };
    }
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

  // Validar cantidad de producto disponible considerando la diferencia (delta)
  // - Si se cambia de comerciable: validar que el nuevo comerciable tenga suficiente para la cantidad efectiva (nueva o existente)
  // - Si se mantiene el mismo comerciable y se modifica la cantidad: validar solo la diferencia positiva (solo restar lo extra)
  const id_comerciable_actual = venta.id_comerciable;
  const id_comerciable_nuevo = ventaData.id_comerciable !== undefined ? ventaData.id_comerciable : id_comerciable_actual;

  if (ventaData.id_comerciable !== undefined && String(ventaData.id_comerciable) !== String(id_comerciable_actual)) {
    // Se está moviendo la venta a otro comerciable: verificar que el nuevo comerciable tenga stock para la cantidad efectiva
    const cantidadEfectiva = ventaData.cantidad !== undefined ? Number(ventaData.cantidad) : Number(venta.cantidad);
    const quantityCheck = await validateProductoQuantity(id_comerciable_nuevo, cantidadEfectiva);
    if (!quantityCheck.valid) {
      errors.push(quantityCheck.error);
    }
  } else if (ventaData.cantidad !== undefined) {
    // Mismo comerciable (o no cambia): validar solo la diferencia positiva
    const cantidadNueva = Number(ventaData.cantidad);
    const cantidadAntigua = Number(venta.cantidad);
    const delta = cantidadNueva - cantidadAntigua;
    if (delta > 0) {
      const quantityCheck = await validateProductoQuantity(id_comerciable_nuevo, delta);
      if (!quantityCheck.valid) {
        errors.push(quantityCheck.error);
      }
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
    await VentaUsuario.bulkCreate(bulk, { transaction: t, ignoreDuplicates: true });

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
    console.error('Error creating Venta:', error);
    if (error && error.name === 'SequelizeValidationError' && Array.isArray(error.errors)) {
      const msgs = error.errors.map(e => e.message).join('; ');
      throw new Error(msgs || 'Validation error');
    }
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
      await VentaUsuario.bulkCreate(bulk, { transaction: t, ignoreDuplicates: true });
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
    // Buscar venta con sus relaciones
    const venta = await Venta.findByPk(id, {
      include: [
        {
          model: Comerciable,
          include: [{ model: Producto }]
        }
      ],
      transaction: t
    });

    if (!venta) {
      await t.rollback();
      return false;
    }

    // Si el comerciable es un producto, devolver la cantidad al inventario
    if (venta.id_comerciable && venta.comerciable && venta.comerciable.producto) {
      const nuevaCantidad = parseFloat(venta.comerciable.producto.cantidad) + parseFloat(venta.cantidad);

      await Producto.update(
        { cantidad: nuevaCantidad },
        {
          where: { id_comerciable: venta.comerciable.producto.id_comerciable },
          transaction: t
        }
      );
    }

    // Eliminar asociaciones pivot
    await VentaUsuario.destroy({
      where: { id_venta: id },
      transaction: t
    });

    // Intentar eliminar fotos - si falla por columna faltante, manejamos de forma especial
    try {
      const fotos = await FotoServicioComplejo.findAll({
        where: { id_venta: id },
        transaction: t
      });

      for (const foto of fotos) {
        const ruta = foto.ruta;
        if (ruta) {
          try {
            await fs.unlink(path.join(__dirname, '..', ruta));
          } catch (e) {
            console.error('unlink error (ignorando):', e.message);
          }
        }
        await foto.destroy({ transaction: t });
      }
    } catch (findErr) {
      console.error('Error during FotoServicioComplejo.findAll:', findErr.message);

      const isMissingColumn = findErr.parent && findErr.parent.code === '42703';
      if (isMissingColumn) {
        // ERROR CRÍTICO: La transacción está ahora ABORTED
        // Necesitamos hacer rollback inmediatamente y ejecutar todo de nuevo sin la parte de fotos
        console.warn('Columna faltante detectada. Haciendo rollback y ejecutando fallback...');
        try {
          await t.rollback();
        } catch (rbErr) {
          console.error('Error durante rollback:', rbErr.message);
        }

        // Ejecutar una nueva transacción SIN la parte de fotos
        return await deleteVentaFallback(id);
      } else {
        // Si no es error de columna faltante, propagamos el error
        throw findErr;
      }
    }

    // Eliminar la venta
    await venta.destroy({ transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    console.error('Error en deleteVenta:', error.message);
    try {
      await t.rollback();
    } catch (rbErr) {
      console.error('Error durante rollback:', rbErr.message);
    }
    throw error;
  }
};

// Función de fallback para cuando la tabla de fotos tiene problemas de esquema
const deleteVentaFallback = async (id) => {
  const t = await sequelize.transaction();
  try {

    // Buscar venta
    const venta = await Venta.findByPk(id, {
      include: [
        {
          model: Comerciable,
          include: [{ model: Producto }]
        }
      ],
      transaction: t
    });

    if (!venta) {
      await t.rollback();
      return false;
    }

    // Devolver cantidad al producto si aplica
    if (venta.id_comerciable && venta.comerciable && venta.comerciable.producto) {
      const nuevaCantidad = parseFloat(venta.comerciable.producto.cantidad) + parseFloat(venta.cantidad);

      await Producto.update(
        { cantidad: nuevaCantidad },
        {
          where: { id_comerciable: venta.comerciable.producto.id_comerciable },
          transaction: t
        }
      );
    }

    // Eliminar asociaciones pivot
    await VentaUsuario.destroy({
      where: { id_venta: id },
      transaction: t
    });

    // Eliminar la venta (sin intentar eliminar fotos)
    await venta.destroy({ transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    console.error('Error en deleteVentaFallback:', error.message);
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
      {
        model: Comerciable, required: false, include: [
          { model: Servicio, required: false, include: [{ model: ServicioComplejo, as: 'servicio_complejo', required: false }] },
          { model: Producto, required: false, include: [{ model: Medicamento, required: false }] }
        ]
      },
      { model: ServicioComplejo, required: false, include: [{ model: Servicio, required: false }] }
      ,{ model: Venta, as: 'VentaRelacionada', required: false }
      ,{ model: Venta, as: 'VentasRelacionadas', required: false, include: 
        {model: Comerciable, required: false, include: [
          {model: Producto, require: false},
          {model: Servicio, require: false}]} }
    ];

    // Filtro detallado
    const detallado = filterCriteria && filterCriteria.detallado !== undefined
      ? (typeof filterCriteria.detallado === 'boolean' ? filterCriteria.detallado : (String(filterCriteria.detallado).toLowerCase() === 'true'))
      : false;

    if (!detallado) {
      whereClause.id_venta_relacionada = null;
    }
    delete filterCriteria.detallado;

    // Filtro por tipo de comerciable
    const tipoComerciableRaw = filterCriteria && filterCriteria.tipo_comerciable ? String(filterCriteria.tipo_comerciable).toLowerCase().trim() : null;
    if (filterCriteria && filterCriteria.tipo_comerciable) {
      delete filterCriteria.tipo_comerciable;
    }

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
      // Buscar el índice del modelo Usuario en include
      const usuarioIndex = include.findIndex(inc => inc.model === Usuario);
      if (usuarioIndex !== -1) {
        include[usuarioIndex].where = { nombre_usuario: { [require('sequelize').Op.iLike]: `%${filterCriteria.nombre_usuario}%` } };
        include[usuarioIndex].required = true;
      }
      delete filterCriteria.nombre_usuario;
    }

    // Filtro por nombre de cliente
    if (filterCriteria && filterCriteria.nombre_cliente) {
      const clienteIndex = include.findIndex(inc => inc.model === Cliente);
      if (clienteIndex !== -1) {
        include[clienteIndex].where = { nombre: { [require('sequelize').Op.iLike]: `%${filterCriteria.nombre_cliente}%` } };
        include[clienteIndex].required = true;
      }
      delete filterCriteria.nombre_cliente;
    }

    // Filtro por nombre de producto (pivota por comerciable)
    if (filterCriteria && filterCriteria.nombre_producto) {
      const comerciableIndex = include.findIndex(inc => inc.model === Comerciable);
      if (comerciableIndex !== -1 && include[comerciableIndex].include) {
        // Buscar el índice de Producto dentro de include[comerciableIndex].include
        const productoIncludeIndex = include[comerciableIndex].include.findIndex(inc => inc.model === Producto);
        if (productoIncludeIndex !== -1) {
          include[comerciableIndex].include[productoIncludeIndex].where = {
            nombre: { [require('sequelize').Op.iLike]: `%${filterCriteria.nombre_producto}%` }
          };
          include[comerciableIndex].include[productoIncludeIndex].required = true;
          include[comerciableIndex].required = true;
        }
      }
      delete filterCriteria.nombre_producto;
    }

    // Filtro por descripción de servicio (pivota por comerciable)
    if (filterCriteria && filterCriteria.descripcion_servicio) {
      const comerciableIndex = include.findIndex(inc => inc.model === Comerciable);
      if (comerciableIndex !== -1 && include[comerciableIndex].include) {
        const servicioIncludeIndex = include[comerciableIndex].include.findIndex(inc => inc.model === Servicio);
        if (servicioIncludeIndex !== -1) {
          include[comerciableIndex].include[servicioIncludeIndex].where = {
            descripcion: { [require('sequelize').Op.iLike]: `%${filterCriteria.descripcion_servicio}%` }
          };
          include[comerciableIndex].include[servicioIncludeIndex].required = true;
          include[comerciableIndex].required = true;
        }
      }
      delete filterCriteria.descripcion_servicio;
    }

    // Filtro por nombre de paciente (pivota por consulta)
    if (filterCriteria && filterCriteria.nombre_paciente) {
      const consultaIndex = include.findIndex(inc => inc.model === Consulta);
      if (consultaIndex !== -1 && include[consultaIndex].include) {
        const pacienteIncludeIndex = include[consultaIndex].include.findIndex(inc => inc.model === Paciente);
        if (pacienteIncludeIndex !== -1) {
          include[consultaIndex].include[pacienteIncludeIndex].where = {
            nombre: { [require('sequelize').Op.iLike]: `%${filterCriteria.nombre_paciente}%` }
          };
          include[consultaIndex].include[pacienteIncludeIndex].required = true;
          include[consultaIndex].required = true;
        }
      }
      delete filterCriteria.nombre_paciente;
    }

    // Filtros generales (cantidad, nota, forma_pago) - solo para campos directos de Venta
    const ventaDirectFields = ['cantidad', 'nota', 'forma_pago'];
    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        if (filterCriteria[key] === undefined || filterCriteria[key] === null) continue;

        // Solo aplicamos filtro LIKE para campos directos de Venta
        if (ventaDirectFields.includes(key)) {
          whereClause[key] = { [require('sequelize').Op.iLike]: `%${String(filterCriteria[key]).toLowerCase()}%` };
        } else {
          // Para otros campos, igualarlos exactamente (ajusta según necesidades)
          whereClause[key] = filterCriteria[key];
        }
      }
    }

    // Si se proporcionó tipo_comerciable, aplicamos filtrado en memoria
    if (tipoComerciableRaw) {
      const allRows = await Venta.findAll({ where: whereClause, include, distinct: true, order: [['fecha', 'DESC']] });

      let filtered = allRows;
      if (tipoComerciableRaw === 'producto') {
        filtered = filtered.filter(v => v.comerciable && v.comerciable.producto && !v.comerciable.producto.medicamento);
      } else if (tipoComerciableRaw === 'medicamento' || tipoComerciableRaw === 'medicamneto') {
        filtered = filtered.filter(v => v.comerciable && v.comerciable.producto && !!v.comerciable.producto.medicamento);
      } else if (tipoComerciableRaw === 'servicio') {
        filtered = filtered.filter(v => {
          const hasServicio = v.comerciable && v.comerciable.servicio;
          const directSC = !!v.servicio_complejo;
          const nestedSC = !!(v.comerciable && v.comerciable.servicio && v.comerciable.servicio.servicio_complejo);
          return hasServicio && !directSC && !nestedSC;
        });
      } else if (tipoComerciableRaw === 'servicio complejo' || tipoComerciableRaw === 'serviciocomplejo' || tipoComerciableRaw === 'servicio_complejo') {
        filtered = filtered.filter(v => {
          const directSC = !!v.servicio_complejo;
          const nestedSC = !!(v.comerciable && v.comerciable.servicio && v.comerciable.servicio.servicio_complejo);
          const byId = v.id_servicio_complejo !== undefined && v.id_servicio_complejo !== null;
          return directSC || nestedSC || byId;
        });
      }

      // Ordenar por fecha (más reciente primero) antes de paginar
      filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      const total = filtered.length;
      const off = Number(offset) || 0;
      const lim = Number(limit) || total;
      const paginated = filtered.slice(off, off + lim);

      return { count: total, rows: paginated };
    }

    const result = await Venta.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include,
      distinct: true,
      order: [['createdAt', 'DESC']]
    });

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
    await VentaUsuario.bulkCreate(bulk, { transaction: t, ignoreDuplicates: true });

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
        {
          model: Comerciable, required: true, include: [
            { model: Producto, required: true, include: [{ model: Medicamento, required: true, where: { tipo_medicamento: tipoMedicamento } }] },
            { model: Servicio, required: false }
          ]
        },
        { model: Cliente, required: false },
        { model: Usuario, required: false },
        { model: ServicioComplejo, required: false }
        ,{ model: Venta, as: 'VentaRelacionada', required: false }
        ,{ model: Venta, as: 'VentasRelacionadas', required: false }
      ]
    });
    return ventas;
  } catch (error) {
    throw error;
  }
};

const getVentasByComerciable = async (id_comerciable) => {
  try {
    const ventas = await Venta.findAll({
      where: { id_comerciable },
      include: [
        { model: Cliente, required: false },
        { model: Consulta, required: false, include: [{ model: Paciente, required: false }] },
        { model: Usuario, required: false },
        {
          model: Comerciable, required: false, include: [
            { model: Servicio, required: false },
            { model: Producto, required: false, include: [{ model: Medicamento, required: false }] }
          ]
        },
        { model: ServicioComplejo, required: false, include: [{ model: Servicio, required: false }] }
        ,{ model: Venta, as: 'VentaRelacionada', required: false }
        ,{ model: Venta, as: 'VentasRelacionadas', required: false }
      ],
      order: [['fecha', 'DESC']]
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
  getVentasByComerciable,
  validateCreate,
  validateUpdate,
  validateDelete,
  validateUpdateUsuarios,
};
