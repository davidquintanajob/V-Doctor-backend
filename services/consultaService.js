const { Consulta } = require('../models/consulta');
const { Paciente } = require('../models/paciente');
const { Usuario } = require('../models/usuario');
const { FotoConsulta } = require('../models/foto_consulta');
const { Venta } = require("../models/venta")
const sequelize = require('../helpers/database');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const { Comerciable } = require('../models/comerciable');
const { Producto } = require('../models/producto');
const { Medicamento } = require('../models/medicamento');
const { Servicio } = require("../models/servicio");
const { ServicioComplejo } = require("../models/servicio_complejo");

const getAllConsultas = async () => {
  try {
    const consultas = await Consulta.findAll({
      include: [
        { model: Paciente, required: false },
        { model: FotoConsulta, required: false },
        { model: Usuario, required: false }
      ]
    });
    return consultas;
  } catch (error) {
    console.error('Error en servicio getAllConsultas:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener consultas');
      err.errors = [error.message || 'Error interno al obtener consultas'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const getConsultaById = async (id) => {
  try {
    const consulta = await Consulta.findOne({
      where: { id_consulta: id },
      include: [
        { model: Paciente, required: false },
        { model: FotoConsulta, required: false },
        { model: Usuario, required: false }
      ]
    });
    return consulta;
  } catch (error) {
    console.error('Error en servicio getConsultaById:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al obtener consulta');
      err.errors = [error.message || 'Error interno al obtener consulta'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const createConsulta = async (consultaData) => {
  try {
    const newConsulta = await Consulta.create(consultaData);
    return await getConsultaById(newConsulta.id_consulta);
  } catch (error) {
    console.error('Error en servicio createConsulta:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al crear consulta');
      err.errors = [error.message || 'Error interno al crear consulta'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const updateConsulta = async (id, consultaData) => {
  try {
    const consulta = await Consulta.findOne({ where: { id_consulta: id } });
    if (!consulta) return null;
    await consulta.update(consultaData);
    return await getConsultaById(consulta.id_consulta);
  } catch (error) {
    console.error('Error en servicio updateConsulta:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al actualizar consulta');
      err.errors = [error.message || 'Error interno al actualizar consulta'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

const deleteConsulta = async (id) => {
  const t = await sequelize.transaction();
  let fotosAEliminar = [];

  try {
    // 1. Buscar consulta con sus fotos
    const consulta = await Consulta.findOne({
      where: { id_consulta: id },
      include: [
        {
          model: FotoConsulta,
          required: false,
          attributes: ['id_foto_consulta', 'ruta']
        }
      ],
      transaction: t
    });

    if (!consulta) {
      await t.rollback();
      return false;
    }
    // Dependiendo de cómo Sequelize haya creado la relación

    // Opción A: Si es 'foto_consulta' (singular)
    if (consulta.foto_consulta && Array.isArray(consulta.foto_consulta)) {
      fotosAEliminar = consulta.foto_consulta.map(foto => ({
        id: foto.id_foto_consulta,
        ruta: foto.ruta
      }));
    }
    // Opción B: Si es 'foto_consultas' (plural)
    else if (consulta.foto_consultas && Array.isArray(consulta.foto_consultas)) {
      fotosAEliminar = consulta.foto_consultas.map(foto => ({
        id: foto.id_foto_consulta,
        ruta: foto.ruta
      }));
    }
    // Opción C: Acceder directamente a dataValues
    else if (consulta.dataValues && consulta.dataValues.foto_consulta) {
      fotosAEliminar = consulta.dataValues.foto_consulta.map(foto => ({
        id: foto.id_foto_consulta || foto.dataValues?.id_foto_consulta,
        ruta: foto.ruta || foto.dataValues?.ruta
      }));
    }

    // 3. Eliminar fotos de la base de datos
    await FotoConsulta.destroy({
      where: { id_consulta: id },
      transaction: t
    });

    // 4. Eliminar la consulta
    await consulta.destroy({ transaction: t });

    // 5. Confirmar transacción
    await t.commit();

    // 6. Eliminar archivos físicos
    if (fotosAEliminar.length > 0) {

      for (const foto of fotosAEliminar) {
        if (!foto.ruta) continue;

        try {
          const rutaCompleta = path.join(__dirname, '..', foto.ruta);

          // Verificar si existe antes de eliminar
          try {
            await fs.access(rutaCompleta);
          } catch {
            console.warn(`⚠️ Archivo no encontrado: ${foto.ruta}`);
            continue;
          }

          await fs.unlink(rutaCompleta);

        } catch (fsError) {
          console.error(`❌ Error al eliminar ${foto.ruta}:`, fsError.message);
        }
      }
    }

    return true;

  } catch (error) {
    if (t && !t.finished) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('Error al revertir transacción:', rollbackError);
      }
    }

    console.error('Error en deleteConsulta:', error);

    const err = new Error(error.message || 'Error interno al eliminar consulta');
    err.status = error.status || 500;
    throw err;
  }
};

const filterConsultasPaginated = async (filterCriteria, limit, offset) => {
  try {
    const whereClause = {};
    const include = [
      { model: Paciente, required: false },
      { model: FotoConsulta, required: false },
      { model: Usuario, required: false },
      {
        model: Venta,
        required: false,
        include: [
          {
            model: Comerciable,
            required: false,
            include: [
              {
                model: Servicio,
                required: false,
                as: 'servicio' // Asegúrate de que este alias coincida con tu definición
              },
              {
                model: Producto,
                required: false,
                include: [
                  {
                    model: Medicamento,
                    required: false
                  }
                ]
              }
            ]
          },
          {
            model: ServicioComplejo,
            required: false,
            foreignKey: 'id_servicio_complejo',
            targetKey: 'id_comerciable'
          }
        ]
      }
    ];

    // Filtro por rango de fecha
    if (filterCriteria && filterCriteria.fecha_desde && filterCriteria.fecha_hasta) {
      whereClause.fecha = {
        [Op.between]: [new Date(filterCriteria.fecha_desde), new Date(filterCriteria.fecha_hasta)]
      };
      delete filterCriteria.fecha_desde;
      delete filterCriteria.fecha_hasta;
    } else if (filterCriteria && filterCriteria.fecha_desde) {
      whereClause.fecha = { [Op.gte]: new Date(filterCriteria.fecha_desde) };
      delete filterCriteria.fecha_desde;
    } else if (filterCriteria && filterCriteria.fecha_hasta) {
      whereClause.fecha = { [Op.lte]: new Date(filterCriteria.fecha_hasta) };
      delete filterCriteria.fecha_hasta;
    }

    // Filtro por nombre de paciente
    if (filterCriteria && filterCriteria.nombre_paciente) {
      include[0].where = { nombre: { [Op.iLike]: `%${filterCriteria.nombre_paciente}%` } };
      // Hacer la inclusión requerida para filtrar correctamente (INNER JOIN)
      include[0].required = true;
      delete filterCriteria.nombre_paciente;
    }

    // Filtro general 'descripcion' -> búsqueda en motivo, diagnostico, anamnesis, tratamiento, patologia
    if (filterCriteria && filterCriteria.descripcion) {
      const val = String(filterCriteria.descripcion);
      whereClause[Op.or] = [
        { motivo: { [Op.iLike]: `%${val}%` } },
        { diagnostico: { [Op.iLike]: `%${val}%` } },
        { anamnesis: { [Op.iLike]: `%${val}%` } },
        { tratamiento: { [Op.iLike]: `%${val}%` } },
        { patologia: { [Op.iLike]: `%${val}%` } }
      ];
      delete filterCriteria.descripcion;
    }

    for (const key in filterCriteria) {
      if (Object.prototype.hasOwnProperty.call(filterCriteria, key)) {
        const val = filterCriteria[key];
        if (val === undefined || val === null) continue;

        // If the field is an ID (starts with 'id_') or the value is an integer, use exact match
        if (/^id_/.test(key) || (typeof val === 'number') || (/^\d+$/.test(String(val)))) {
          const intVal = parseInt(val);
          if (!isNaN(intVal)) {
            whereClause[key] = { [Op.eq]: intVal };
          } else {
            // fallback to exact string match if not a parsable int
            whereClause[key] = { [Op.eq]: String(val) };
          }
        } else {
          // Default: case-insensitive partial match for strings
          whereClause[key] = { [Op.iLike]: `%${String(val).toLowerCase()}%` };
        }
      }
    }

    const result = await Consulta.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      include,
      distinct: true,
      order: [['createdAt', 'DESC']]
    });
    return result;
  } catch (error) {
    console.error('Error en servicio filterConsultasPaginated:', error);
    if (!error.errors || !Array.isArray(error.errors)) {
      const err = new Error(error.message || 'Error interno al filtrar consultas');
      err.errors = [error.message || 'Error interno al filtrar consultas'];
      err.status = error.status || 500;
      throw err;
    }
    throw error;
  }
};

// Crea consulta con lista de fotos (transaccional)
const createConsultaWithPhotos = async (consultaData, fotos) => {
  const t = await sequelize.transaction();
  let consultaCreada = null;
  let imagenesGuardadas = []; // Para limpieza en caso de error

  try {
    consultaCreada = await Consulta.create(consultaData, { transaction: t });

    const idConsulta = consultaCreada.id_consulta;

    const FOTOS_CARPETA_CONSULTA = process.env.FOTOS_CARPETA_CONSULTA || 'fotos/consulta';
    const folderPath = path.join(__dirname, '..', FOTOS_CARPETA_CONSULTA);

    // Crear carpeta si no existe
    await fs.mkdir(folderPath, { recursive: true });

    // 2. PROCESAR CADA FOTO EN LA MISMA TRANSACCIÓN
    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];
      const index = i + 1;

      // Validar imagen
      if (!foto.imagen || typeof foto.imagen !== 'string') {
        throw new Error(`La foto ${index} no tiene una imagen válida`);
      }

      // Procesar base64
      let base64Data = foto.imagen;
      if (base64Data.includes('base64,')) {
        base64Data = base64Data.split('base64,')[1];
      }

      // Validar que sea base64 válido
      if (!base64Data || base64Data.trim() === '') {
        throw new Error(`La foto ${index} tiene un formato Base64 inválido`);
      }

      // Nombre de archivo
      const nombreArchivo = `${idConsulta}-${index}.jpg`;
      const rutaCompleta = path.join(folderPath, nombreArchivo);
      const rutaParaBD = path.join(FOTOS_CARPETA_CONSULTA, nombreArchivo);

      // 3. GUARDAR IMAGEN EN DISCO (fuera de transacción BD, pero monitoreamos)
      try {
        await fs.writeFile(rutaCompleta, base64Data, 'base64');
        imagenesGuardadas.push(rutaCompleta); // Registrar para posible limpieza
      } catch (fsError) {
        throw new Error(`Error al guardar imagen ${index}: ${fsError.message}`);
      }

      // 4. CREAR REGISTRO DE FOTO EN TRANSACCIÓN
      try {
        await FotoConsulta.create({
          ruta: rutaParaBD.replace(/\\/g, '/'),
          nota: foto.nota || null,
          id_consulta: idConsulta
        }, { transaction: t });
      } catch (dbError) {
        throw new Error(`Error al crear registro de foto ${index}: ${dbError.message}`);
      }
    }

    await t.commit();

    // 6. OBTENER CONSULTA COMPLETA CON RELACIONES
    const consultaCompleta = await Consulta.findOne({
      where: { id_consulta: idConsulta },
      include: [
        { model: Paciente },
        { model: Usuario },
        { model: FotoConsulta }
      ]
    });

    return consultaCompleta;

  } catch (error) {
    console.error('❌ ERROR DETECTADO EN TRANSACCIÓN:', error.message);

    // A. PRIMERO: REVERTIR TRANSACCIÓN DE BD (si sigue activa)
    if (t && !t.finished) {
      try {
        await t.rollback();
      } catch (rollbackError) {
        console.error('⚠️ Error al revertir transacción BD:', rollbackError.message);
      }
    }

    // B. SEGUNDO: LIMPIAR IMÁGENES GUARDADAS EN DISCO
    if (imagenesGuardadas.length > 0) {
      for (const imagenPath of imagenesGuardadas) {
        try {
          await fs.unlink(imagenPath);
        } catch (unlinkError) {
          console.warn(`⚠️ No se pudo eliminar imagen ${imagenPath}:`, unlinkError.message);
        }
      }
    }

    // C. TERCERO: SI LA CONSULTA SE CREÓ PERO LA TRANSACCIÓN FALLÓ, ELIMINARLA
    if (consultaCreada && t && t.finished === 'rolled back') {
      try {
        // Buscar si aún existe (puede que el rollback ya la haya eliminado)
        const consultaExistente = await Consulta.findByPk(consultaCreada.id_consulta);
        if (consultaExistente) {
          await consultaExistente.destroy();
        }
      } catch (deleteError) {
        console.warn('⚠️ No se pudo eliminar consulta huérfana:', deleteError.message);
      }
    }

    // D. PROPAGAR ERROR CON INFORMACIÓN CLARA
    console.error('Error completo:', {
      name: error.name,
      message: error.message,
      status: error.status || 500
    });

    const status = error.status ||
      (error.name === 'SequelizeForeignKeyConstraintError' ? 400 :
        error.name === 'SequelizeValidationError' ? 400 : 500);

    const err = new Error(error.message || 'Error al crear consulta con fotos');
    err.errors = [error.message];
    err.status = status;
    err.name = error.name;

    throw err;
  }
};

module.exports = {
  getAllConsultas,
  getConsultaById,
  createConsulta,
  updateConsulta,
  deleteConsulta,
  filterConsultasPaginated,
  createConsultaWithPhotos,
};
