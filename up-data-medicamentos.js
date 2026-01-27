const axios = require('axios');

// Datos de medicamentos - solo los que tienen nombre válido
const datosMedicamentos = [
  // Sueros
  { nombre: "Dextrosa 5%", unidad: "ml", clasificacion: "Sueros", sub: "" },
  { nombre: "Dextrosa x%", unidad: "ml", clasificacion: "Sueros", sub: "" },
  { nombre: "Solución Salina Fisiologica 0,9%", unidad: "ml", clasificacion: "Sueros", sub: "" },
  { nombre: "Solución Salina Fisiologica x%", unidad: "ml", clasificacion: "Sueros", sub: "" },
  { nombre: "Ringer", unidad: "ml", clasificacion: "Sueros", sub: "" },
  { nombre: "Agua para inyección", unidad: "ml", clasificacion: "Sueros", sub: "" },
  { nombre: "Manitol", unidad: "ml", clasificacion: "Sueros", sub: "" },
  { nombre: "Gel Fusin", unidad: "ml", clasificacion: "Sueros", sub: "" },
  { nombre: "Dextrano", unidad: "ml", clasificacion: "Sueros", sub: "" },
  { nombre: "Aminoplasma", unidad: "ml", clasificacion: "Sueros", sub: "" },
  { nombre: "Lipofundin", unidad: "ml", clasificacion: "Sueros", sub: "" },
  
  // Digestivos
  { nombre: "Metoclopramida", unidad: "ml", clasificacion: "Medicamentos", sub: "Digestivos" },
  { nombre: "Ranitidina", unidad: "ml", clasificacion: "Medicamentos", sub: "Digestivos" },
  { nombre: "Omeprasol", unidad: "ml", clasificacion: "Medicamentos", sub: "Digestivos" },
  { nombre: "Ondasetron", unidad: "ml", clasificacion: "Medicamentos", sub: "Digestivos" },
  { nombre: "Gravinol", unidad: "ml", clasificacion: "Medicamentos", sub: "Digestivos" },
  { nombre: "Diarrex", unidad: "ml", clasificacion: "Medicamentos", sub: "Digestivos" },
  
  // Analgesicos
  { nombre: "Diclofenaco", unidad: "ml", clasificacion: "Medicamentos", sub: "Analgesicos" },
  { nombre: "Meloxicam 5%", unidad: "ml", clasificacion: "Medicamentos", sub: "Analgesicos" },
  { nombre: "Meloxicam 20%", unidad: "ml", clasificacion: "Medicamentos", sub: "Analgesicos" },
  { nombre: "Flunixin", unidad: "ml", clasificacion: "Medicamentos", sub: "Analgesicos" },
  { nombre: "Dipirona", unidad: "ml", clasificacion: "Medicamentos", sub: "Analgesicos" },
  { nombre: "Tramadol", unidad: "ml", clasificacion: "Medicamentos", sub: "Analgesicos" },
  
  // Antibioticos
  { nombre: "Penistrepto LA", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Gentamicina", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Gentamox", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Enrofloxacina 5%", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Enrofloxacina 10%", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Enrofloxacina 15%", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Enrofloxacina 20%", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Oxitetraciclina", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Oximic plus", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Veterralem", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Butraciclina", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Doxiciclina", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Hemolab", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Florfenicol", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Sulfaprim", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Triple Sulfa", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  { nombre: "Imidogan", unidad: "ml", clasificacion: "Medicamentos", sub: "Antibioticos" },
  
  // Vitaminas y Minerales
  { nombre: "Hierro 100", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "Hierro 200", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "B plex", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "Vita Dunkel", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "Vitamina B12", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "Cebador", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "Revimin", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "AD3E", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "Vitamina K", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "Calcio Complex", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "Calcio Simple", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "Calcio Vitaminado", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  { nombre: "AllVit", unidad: "ml", clasificacion: "Medicamentos", sub: "Vitaminas y Minerales" },
  
  // Estimulantes
  { nombre: "Pangamine", unidad: "ml", clasificacion: "Medicamentos", sub: "Estimulantes" },
  { nombre: "Hepatone", unidad: "ml", clasificacion: "Medicamentos", sub: "Estimulantes" },
  { nombre: "Hepatojet", unidad: "ml", clasificacion: "Medicamentos", sub: "Estimulantes" },
  { nombre: "Proteizoo", unidad: "ml", clasificacion: "Medicamentos", sub: "Estimulantes" },
  { nombre: "Euyacol", unidad: "ml", clasificacion: "Medicamentos", sub: "Estimulantes" },
  { nombre: "Boldenona", unidad: "ml", clasificacion: "Medicamentos", sub: "Estimulantes" },
  
  // Neurolepticos
  { nombre: "Diazepam", unidad: "ml", clasificacion: "Medicamentos", sub: "Neurolepticos" },
  { nombre: "Leviteracetam", unidad: "ml", clasificacion: "Medicamentos", sub: "Neurolepticos" },
  { nombre: "Fenitoina", unidad: "ml", clasificacion: "Medicamentos", sub: "Neurolepticos" },
  { nombre: "Fenobarbital", unidad: "ml", clasificacion: "Medicamentos", sub: "Neurolepticos" },
  
  // Varios
  { nombre: "Prifinial", unidad: "ml", clasificacion: "Medicamentos", sub: "Varios" },
  { nombre: "Furosemida", unidad: "ml", clasificacion: "Medicamentos", sub: "Varios" },
  { nombre: "Histafin", unidad: "ml", clasificacion: "Medicamentos", sub: "Varios" },
  { nombre: "Dexametazona 2%", unidad: "ml", clasificacion: "Medicamentos", sub: "Varios" },
  { nombre: "dexametazona 4%", unidad: "ml", clasificacion: "Medicamentos", sub: "Varios" },
  { nombre: "Oxitosina", unidad: "ml", clasificacion: "Medicamentos", sub: "Varios" },
  { nombre: "Atropina", unidad: "ml", clasificacion: "Medicamentos", sub: "Varios" },
  { nombre: "Acido Transhexamico", unidad: "ml", clasificacion: "Medicamentos", sub: "Varios" },
  { nombre: "Hemostop K", unidad: "ml", clasificacion: "Medicamentos", sub: "Varios" },
  { nombre: "Hidrocortizona", unidad: "ml", clasificacion: "Medicamentos", sub: "Varios" },
  
  // Anestesicos
  { nombre: "Ketamina 10", unidad: "ml", clasificacion: "Medicamentos", sub: "Anestesicos" },
  { nombre: "Ketamina 50", unidad: "ml", clasificacion: "Medicamentos", sub: "Anestesicos" },
  { nombre: "Tiopental", unidad: "ml", clasificacion: "Medicamentos", sub: "Anestesicos" },
  { nombre: "Propofol", unidad: "ml", clasificacion: "Medicamentos", sub: "Anestesicos" },
  { nombre: "Lidocaina", unidad: "ml", clasificacion: "Medicamentos", sub: "Anestesicos" },
  { nombre: "Midazolam", unidad: "ml", clasificacion: "Medicamentos", sub: "Anestesicos" },
  { nombre: "Xilaxina 2%", unidad: "ml", clasificacion: "Medicamentos", sub: "Anestesicos" },
  { nombre: "Xilacina 10%", unidad: "ml", clasificacion: "Medicamentos", sub: "Anestesicos" },
  { nombre: "Acepromacina", unidad: "ml", clasificacion: "Medicamentos", sub: "Anestesicos" },
  { nombre: "Soletil", unidad: "ml", clasificacion: "Medicamentos", sub: "Anestesicos" },
  
  // Antiparasitarios
  { nombre: "Vermic Total", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Biovermic", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Adecto", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "ONE", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Well Cam 3", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Oxantel", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Tenibest", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Albendazol", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Praxtel", unidad: "ml", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Pirantel", unidad: "ml", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Levamisol", unidad: "ml", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Ivermectina1%", unidad: "ml", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Toltrasuril 5%", unidad: "ml", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Toltrasuril 2,5%", unidad: "ml", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Simparica 5mg", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Simparica 10mg", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Simparica 20mg", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Simparica 40mg", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Simparica 80mg", unidad: "tab", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  { nombre: "Fipronil", unidad: "vial", clasificacion: "Medicamentos", sub: "Antiparasitarios" },
  
  // Insumos
  { nombre: "Algodón", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Gasa", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Apositos pequeño", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Apositos mediano", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Apositos grande", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Torunda", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Yeso", unidad: "rollo", clasificacion: "Insumos", sub: "" },
  { nombre: "Guata p yeso", unidad: "rollo", clasificacion: "Insumos", sub: "" },
  { nombre: "Esparadrapo", unidad: "rollo", clasificacion: "Insumos", sub: "" },
  { nombre: "Viales 0,1", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Viales 0,5", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Viales 1,5", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Viales 4,0", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Bisturis", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Hilo Nylon", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Hilo Seda", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Hilo Catgut", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Hilo Sintetico reabsorvible", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Hilo Sintetico no reabsorvible", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Venoclip", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Agujas", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Mochitas", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Branulas", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Jeringas 1ml", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Jeringas 2,5ml", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Jeringas 3ml", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Jeringas 5ml", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Jeringas 10ml", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Jeringas 20ml", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Jeringas 50ml", unidad: "u", clasificacion: "Insumos", sub: "" },
  { nombre: "Sonda", unidad: "u", clasificacion: "Insumos", sub: "" },
  
  // Biologicos - vacunas
  { nombre: "Parvovirus", unidad: "u", clasificacion: "Biologicos", sub: "vacunas" },
  { nombre: "Pentavalente", unidad: "u", clasificacion: "Biologicos", sub: "vacunas" },
  { nombre: "Hexavalente", unidad: "u", clasificacion: "Biologicos", sub: "vacunas" },
  { nombre: "Rabia Virbac", unidad: "u", clasificacion: "Biologicos", sub: "vacunas" },
  { nombre: "Rabia Americana monodosis", unidad: "u", clasificacion: "Biologicos", sub: "vacunas" },
  { nombre: "Anticonseptivo", unidad: "u", clasificacion: "Biologicos", sub: "vacunas" }
];

const API_URL = "http://192.168.1.200:4000";

// Tipos de medicamento disponibles
const tiposMedicamento = [
  "vacuna", "antiparasitario", "antibiótico", "digestivo", "vitaminico", 
  "anestesico", "sedante", "crema", "oftalmico", "otico", "energizante", 
  "inmuno estimulante", "anticeptico", "desinfectante", "antiinflamatorio", "analgésico"
];

// Función para determinar el tipo de medicamento basado en nombre y subcategoría
function determinarTipoMedicamento(item) {
  const nombreLower = item.nombre.toLowerCase();
  const subLower = item.sub.toLowerCase();
  
  // Primero verificar por subcategoría
  if (subLower.includes("vacuna") || nombreLower.includes("vacuna")) {
    return "vacuna";
  }
  if (subLower.includes("antiparasitario") || nombreLower.includes("vermic") || 
      nombreLower.includes("parasit") || nombreLower.includes("ivermectin") ||
      nombreLower.includes("albendazol") || nombreLower.includes("praziquantel")) {
    return "antiparasitario";
  }
  if (subLower.includes("antibiotico") || nombreLower.includes("ciclina") ||
      nombreLower.includes("floxacina") || nombreLower.includes("micina") ||
      nombreLower.includes("peni") || nombreLower.includes("sulfa")) {
    return "antibiótico";
  }
  if (subLower.includes("digestivo")) {
    return "digestivo";
  }
  if (subLower.includes("vitamina") || nombreLower.includes("vitamina") ||
      nombreLower.includes("hierro") || nombreLower.includes("calcio") ||
      nombreLower.includes("b12") || nombreLower.includes("plex")) {
    return "vitaminico";
  }
  if (subLower.includes("anestesico") || nombreLower.includes("ketamina") ||
      nombreLower.includes("xilacina") || nombreLower.includes("lidocaina") ||
      nombreLower.includes("propofol")) {
    return "anestesico";
  }
  if (subLower.includes("sedante") || nombreLower.includes("diazepam") ||
      nombreLower.includes("midazolam") || subLower.includes("neuroleptico")) {
    return "sedante";
  }
  if (subLower.includes("analgesico") || subLower.includes("antiinflamatorio") ||
      nombreLower.includes("meloxicam") || nombreLower.includes("diclofenaco") ||
      nombreLower.includes("flunixin")) {
    return subLower.includes("analgesico") ? "analgésico" : "antiinflamatorio";
  }
  if (subLower.includes("estimulante") || nombreLower.includes("energizante")) {
    return "energizante";
  }
  
  // Si no coincide con nada, usar energizante por defecto
  return "energizante";
}

async function crearMedicamento(item, codigo) {
  const tipo = determinarTipoMedicamento(item);
  
  const body = {
    "nombre": item.nombre,
    "costo_usd": "0",
    "costo_cup": "0",
    "categoria": item.clasificacion,
    "nota": "",
    "codigo": codigo,
    "precio_usd": "0",
    "precio_cup": "0",
    "roles_autorizados": "Administrador, Médico, Técnico, Estilista",
    "tipo_medicamento": tipo,
    "unidad_medida": item.unidad || "",
    "posologia": ""
  };
  const token = "";
  
  try {
    const response = await axios.post(`${API_URL}/medicamento/CreateMedicamento`, body);
    console.log(`✅ ${item.nombre} (Código: ${codigo}) - Tipo: ${tipo} - Creado`);
    return { success: true, data: response.data };
  } catch (error) {
    let errorMessage = 'Error desconocido';
    
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;
      
      if (responseData && responseData.errors && Array.isArray(responseData.errors)) {
        errorMessage = responseData.errors.join('\n• ');
      } else if (responseData && typeof responseData.error === 'string') {
        errorMessage = responseData.error;
      } else if (responseData && (responseData.message || responseData.description)) {
        errorMessage = responseData.message || responseData.description;
      } else if (responseData) {
        errorMessage = JSON.stringify(responseData);
      }
      
      console.log(`❌ Error ${status} al crear "${item.nombre}" (Código: ${codigo}): ${errorMessage}`);
    } else if (error.request) {
      errorMessage = 'No se recibió respuesta del servidor';
      console.log(`❌ Sin respuesta del servidor para "${item.nombre}": ${error.message}`);
    } else {
      errorMessage = error.message;
      console.log(`❌ Error de configuración para "${item.nombre}": ${error.message}`);
    }
    
    return { success: false, error: errorMessage };
  }
}

async function crearTodosMedicamentos() {
  console.log(`Creando ${datosMedicamentos.length} medicamentos...\n`);
  
  let exitosos = 0;
  let fallidos = 0;
  let codigoBase = 36; // Empieza desde 36 como solicitaste
  
  for (let i = 0; i < datosMedicamentos.length; i++) {
    const item = datosMedicamentos[i];
    const codigo = codigoBase + i;
    
    const resultado = await crearMedicamento(item, codigo);
    
    if (resultado.success) {
      exitosos++;
    } else {
      fallidos++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Resultado medicamentos:`);
  console.log(`✅ ${exitosos} medicamentos creados exitosamente`);
  console.log(`❌ ${fallidos} medicamentos fallaron`);
}

crearTodosMedicamentos();