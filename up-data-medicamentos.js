const axios = require('axios');

// Función para convertir valores con coma decimal a números
function parseNumber(str) {
  if (!str || str.trim() === '' || str === "0") return null;
  // Reemplazar coma por punto y eliminar espacios
  const numStr = str.trim().replace(',', '.');
  return parseFloat(numStr);
}

// Función para calcular valores faltantes según la tasa de cambio (500 CUP = 1 USD)
function calcularValores(costoCUP, costoUSD, precioCUP, precioUSD) {
  const tasa = 500;
  let costo_cup = 0;
  let costo_usd = 0;
  let precio_cup = 0;
  let precio_usd = 0;

  // Calcular costos
  if (costoUSD !== null && costoUSD !== 0) {
    costo_usd = costoUSD;
    costo_cup = costoUSD * tasa;
  } else if (costoCUP !== null && costoCUP !== 0) {
    costo_cup = costoCUP;
    costo_usd = costoCUP / tasa;
  }

  // Calcular precios
  if (precioUSD !== null && precioUSD !== 0) {
    precio_usd = precioUSD;
    precio_cup = precioUSD * tasa;
  } else if (precioCUP !== null && precioCUP !== 0) {
    precio_cup = precioCUP;
    precio_usd = precioCUP / tasa;
  }

  return {
    costo_cup: Math.round(costo_cup),
    costo_usd: parseFloat(costo_usd.toFixed(5)),
    precio_cup: Math.round(precio_cup),
    precio_usd: parseFloat(precio_usd.toFixed(5))
  };
}

// Tipos de medicamento que admite la API
const tiposMedicamentoAPI = [
  "vacuna", "antiparasitario", "antibiótico", "digestivo", "vitaminico",
  "anestesico", "sedante", "crema", "oftalmico", "otico", "energizante",
  "inmuno estimulante", "anticeptico", "desinfectante", "antiinflamatorio", "analgésico"
];

// Función para determinar el tipo de medicamento basado en nombre, clasificación y subcategoría
function determinarTipoMedicamento(item) {
  const nombreLower = item.nombre.toLowerCase();
  const subLower = item.sub ? item.sub.toLowerCase() : "";
  const clasificacionLower = item.clasificacion ? item.clasificacion.toLowerCase() : "";

  // Primero verificar por subcategoría
  if (subLower.includes("vacuna") || nombreLower.includes("parvovirus") ||
    nombreLower.includes("pentavalente") || nombreLower.includes("hexavalente") ||
    nombreLower.includes("rabia") || nombreLower.includes("anticonseptivo")) {
    return "vacuna";
  }

  if (subLower.includes("antiparasitarios") || nombreLower.includes("vermic") ||
    nombreLower.includes("adecto") || nombreLower.includes("one") ||
    nombreLower.includes("albendazol") || nombreLower.includes("ivermectin") ||
    nombreLower.includes("simparica") || nombreLower.includes("fipronil") ||
    nombreLower.includes("praziquantel") || nombreLower.includes("pirantel") ||
    nombreLower.includes("levamisol") || nombreLower.includes("oxantel") ||
    nombreLower.includes("toltrasuril") || nombreLower.includes("tenibest")) {
    return "antiparasitario";
  }

  if (subLower.includes("antibioticos") || nombreLower.includes("penistrepto") ||
    nombreLower.includes("penicilina") || nombreLower.includes("gentamicina") ||
    nombreLower.includes("enrofloxacina") || nombreLower.includes("oxitetraciclina") ||
    nombreLower.includes("doxiciclina") || nombreLower.includes("florfenicol") ||
    nombreLower.includes("sulfaprim") || nombreLower.includes("imidogan") ||
    nombreLower.includes("butraciclina") || nombreLower.includes("hemolab")) {
    return "antibiótico";
  }

  if (subLower.includes("digestivos")) {
    return "digestivo";
  }

  if (subLower.includes("analgesicos") || nombreLower.includes("diclofenaco") ||
    nombreLower.includes("meloxicam") || nombreLower.includes("flunixin") ||
    nombreLower.includes("dipirona") || nombreLower.includes("tramadol")) {
    return "analgésico";
  }

  if (subLower.includes("anestesicos") || nombreLower.includes("ketamina") ||
    nombreLower.includes("xilaxina") || nombreLower.includes("xilacina") ||
    nombreLower.includes("lidocaina") || nombreLower.includes("propofol") ||
    nombreLower.includes("acepromacina") || nombreLower.includes("soletil") ||
    nombreLower.includes("tiopental") || nombreLower.includes("midazolam")) {
    return "anestesico";
  }

  if (subLower.includes("neurolepticos") || nombreLower.includes("diazepam") ||
    nombreLower.includes("leviteracetam") || nombreLower.includes("fenitoina") ||
    nombreLower.includes("fenobarbital")) {
    return "sedante";
  }

  if (subLower.includes("vitaminas y minerales") || nombreLower.includes("hierro") ||
    nombreLower.includes("vitamina") || nombreLower.includes("calcio") ||
    nombreLower.includes("b plex") || nombreLower.includes("cebador") ||
    nombreLower.includes("revimin") || nombreLower.includes("allvit")) {
    return "vitaminico";
  }

  if (subLower.includes("estimulantes") || nombreLower.includes("pangamine") ||
    nombreLower.includes("hepatone") || nombreLower.includes("hepatoget") ||
    nombreLower.includes("proteizoo") || nombreLower.includes("euyacol") ||
    nombreLower.includes("boldenona")) {
    return "energizante";
  }

  if (nombreLower.includes("dexametazona") || nombreLower.includes("hidrocortizona") ||
    nombreLower.includes("prifinial")) {
    return "antiinflamatorio";
  }

  // Si no coincide con nada, usar "crema" como valor por defecto
  return "crema";
}

// Datos de medicamentos del Excel (sin sueros e insumos)
const datosMedicamentos = [
  // Digestivos
  {
    nombre: "Metoclopramida",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Digestivos",
    costo_cup: parseNumber("125") || null,
    costo_usd: parseNumber("0,25") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Ranitidina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Digestivos",
    costo_cup: parseNumber("125") || null,
    costo_usd: parseNumber("0,25") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Omeprasol",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Digestivos",
    costo_cup: parseNumber("100") || null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Ondasetron",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Digestivos",
    costo_cup: parseNumber("100") || null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Gravinol",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Digestivos",
    costo_cup: parseNumber("100") || null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Diarrex",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Digestivos",
    costo_cup: parseNumber("100") || null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "200 0,4"
  },

  // Analgesicos
  {
    nombre: "Diclofenaco",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Analgesicos",
    costo_cup: parseNumber("100") || null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("100") || null,
    precio_usd: parseNumber("0,2") || null,
    nota: "100 0,2"
  },
  {
    nombre: "Meloxicam 5%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Analgesicos",
    costo_cup: parseNumber("100") || null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Meloxicam 20%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Analgesicos",
    costo_cup: parseNumber("100") || null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "200 0,4"
  },
  {
    nombre: "Flunixin",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Analgesicos",
    costo_cup: parseNumber("100") || null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "200 0,4"
  },
  {
    nombre: "Dipirona",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Analgesicos",
    costo_cup: parseNumber("100") || null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Tramadol",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Analgesicos",
    costo_cup: parseNumber("150") || null,
    costo_usd: parseNumber("0,30") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "200 0,4"
  },

  // Antibioticos
  {
    nombre: "Penistrepto LA",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "200 0,4"
  },
  {
    nombre: "Penicilina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Gentamicina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Gentamox",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Enrofloxacina 5%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "5mg x kg (1x10)"
  },
  {
    nombre: "Enrofloxacina 10%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "5mg x kg (1x20)"
  },
  {
    nombre: "Enrofloxacina 15%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "5mg x kg (1x30)"
  },
  {
    nombre: "Enrofloxacina 20%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "5mg x kg (1x40)"
  },
  {
    nombre: "Oxitetraciclina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "200 0,4"
  },
  {
    nombre: "Oximic plus",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1ml x 10 kg"
  },
  {
    nombre: "Veterralem",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "200 0,4"
  },
  {
    nombre: "Butraciclina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1ml x 15 kg"
  },
  {
    nombre: "Doxiciclina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1ml x 10kg"
  },
  {
    nombre: "Hemolab",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,25") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1ml x 10kg"
  },
  {
    nombre: "Florfenicol",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1ml x40 kg"
  },
  {
    nombre: "Sulfaprim",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Triple Sulfa",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "150 0,3"
  },
  {
    nombre: "Imidogan",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antibioticos",
    costo_cup: null,
    costo_usd: parseNumber("0,25") || null,
    precio_cup: parseNumber("250") || null,
    precio_usd: parseNumber("0,5") || null,
    nota: "1ml x 20kg"
  },

  // Vitaminas y Minerales
  {
    nombre: "Hierro 100",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1ml x 10kg"
  },
  {
    nombre: "Hierro 200",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1ml x 20 kg"
  },
  {
    nombre: "B plex",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1ml x 20 kg"
  },
  {
    nombre: "Vita Dunkel",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1ml x 20 kg"
  },
  {
    nombre: "Vitamina B12",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1ml x 20 kg"
  },
  {
    nombre: "Cebador",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "0,5 ml x animal"
  },
  {
    nombre: "Revimin",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,25") || null,
    precio_cup: parseNumber("250") || null,
    precio_usd: parseNumber("0,5") || null,
    nota: ""
  },
  {
    nombre: "AD3E",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1Ml x"
  },
  {
    nombre: "Vitamina K",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1Ml x"
  },
  {
    nombre: "Calcio Complex",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,10") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1Ml x"
  },
  {
    nombre: "Calcio Simple",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,10") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1Ml x"
  },
  {
    nombre: "Calcio Vitaminado",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,10") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1ml x 5a10 kg"
  },
  {
    nombre: "AllVit",
    unidad: "gr",
    clasificacion: "Medicamentos",
    sub: "Vitaminas y Minerales",
    costo_cup: null,
    costo_usd: parseNumber("0,05") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "vial más 30 ml de agua, administrar 1ml 2 veces por dia oral"
  },

  // Estimulantes
  {
    nombre: "Pangamine",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Estimulantes",
    costo_cup: null,
    costo_usd: parseNumber("0,40") || null,
    precio_cup: parseNumber("300") || null,
    precio_usd: parseNumber("0,6") || null,
    nota: "1Ml x"
  },
  {
    nombre: "Hepatone",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Estimulantes",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1ml x 10 kg"
  },
  {
    nombre: "Hepatojet",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Estimulantes",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1ml x 20 kg"
  },
  {
    nombre: "Proteizoo",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Estimulantes",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "0,5 a 1 ml xanimal"
  },
  {
    nombre: "Euyacol",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Estimulantes",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "0,2 a 0,5 x 5 kg"
  },
  {
    nombre: "Boldenona",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Estimulantes",
    costo_cup: null,
    costo_usd: parseNumber("0,25") || null,
    precio_cup: parseNumber("300") || null,
    precio_usd: parseNumber("0,6") || null,
    nota: "1ml x 20 kg perros y gatos"
  },

  // Neurolepticos
  {
    nombre: "Diazepam",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Neurolepticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1Ml x"
  },
  {
    nombre: "Leviteracetam",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Neurolepticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1Ml x"
  },
  {
    nombre: "Fenitoina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Neurolepticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1Ml x"
  },
  {
    nombre: "Fenobarbital",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Neurolepticos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1Ml x"
  },

  // Varios
  {
    nombre: "Prifinial",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Varios",
    costo_cup: null,
    costo_usd: parseNumber("0,35") || null,
    precio_cup: parseNumber("250") || null,
    precio_usd: parseNumber("0,5") || null,
    nota: "1ml x 10kg"
  },
  {
    nombre: "Furosemida",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Varios",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1ml x 10kg"
  },
  {
    nombre: "Histafin",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Varios",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1ml x 10kg"
  },
  {
    nombre: "Dexametazona 2%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Varios",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1 ml x 50 Kg"
  },
  {
    nombre: "dexametazona 4%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Varios",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1 ml x 100 Kg"
  },
  {
    nombre: "Oxitosina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Varios",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("250") || null,
    precio_usd: parseNumber("0,5") || null,
    nota: "1 ml x20 kg"
  },
  {
    nombre: "Atropina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Varios",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1 ml x 10 Kg"
  },
  {
    nombre: "Acido Transhexamico",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Varios",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1 ml x 10-20 kg"
  },
  {
    nombre: "Hemostop K",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Varios",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("200") || null,
    precio_usd: parseNumber("0,4") || null,
    nota: "1 ml x 10 Kg"
  },
  {
    nombre: "Hidrocortizona",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Varios",
    costo_cup: null,
    costo_usd: parseNumber("0,05") || null,
    precio_cup: parseNumber("50") || null,
    precio_usd: parseNumber("0,1") || null,
    nota: "1 ml x 10 Kg"
  },

  // Anestesicos
  {
    nombre: "Ketamina 10",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Anestesicos",
    costo_cup: null,
    costo_usd: parseNumber("1,00") || null,
    precio_cup: null,
    precio_usd: 0,
    nota: "5-15mg x kg perros, 10-33 mg x kg gatos"
  },
  {
    nombre: "Ketamina 50",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Anestesicos",
    costo_cup: null,
    costo_usd: parseNumber("1,00") || null,
    precio_cup: null,
    precio_usd: 0,
    nota: "5-15mg x kg perros, 10-33 mg x kg gatos"
  },
  {
    nombre: "Tiopental",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Anestesicos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: null,
    precio_usd: 0,
    nota: "15-24 mg x kg"
  },
  {
    nombre: "Propofol",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Anestesicos",
    costo_cup: null,
    costo_usd: parseNumber("0,10") || null,
    precio_cup: null,
    precio_usd: 0,
    nota: "1-2 mg x kg"
  },
  {
    nombre: "Lidocaina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Anestesicos",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: null,
    precio_usd: 0,
    nota: ""
  },
  {
    nombre: "Midazolam",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Anestesicos",
    costo_cup: null,
    costo_usd: parseNumber("0,30") || null,
    precio_cup: null,
    precio_usd: 0,
    nota: ""
  },
  {
    nombre: "Xilaxina 2%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Anestesicos",
    costo_cup: null,
    costo_usd: parseNumber("0,85") || null,
    precio_cup: null,
    precio_usd: 0,
    nota: "0,5 mg x kg"
  },
  {
    nombre: "Xilacina 10%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Anestesicos",
    costo_cup: null,
    costo_usd: parseNumber("0,80") || null,
    precio_cup: null,
    precio_usd: 0,
    nota: "0,5 mg x kg"
  },
  {
    nombre: "Acepromacina",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Anestesicos",
    costo_cup: null,
    costo_usd: parseNumber("0,80") || null,
    precio_cup: null,
    precio_usd: 0,
    nota: "0,1-0,5 x kg"
  },

  // Antiparasitarios
  {
    nombre: "Vermic Total",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,50") || null,
    precio_cup: parseNumber("500") || null,
    precio_usd: parseNumber("1") || null,
    nota: "1 Tab x 10 Kg"
  },
  {
    nombre: "Biovermic",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,35") || null,
    precio_cup: parseNumber("500") || null,
    precio_usd: parseNumber("1") || null,
    nota: "1 Tab x 10 Kg"
  },
  {
    nombre: "Adecto",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,70") || null,
    precio_cup: parseNumber("600") || null,
    precio_usd: parseNumber("1,2") || null,
    nota: "1 Tab x 10 Kg"
  },
  {
    nombre: "ONE",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,70") || null,
    precio_cup: parseNumber("600") || null,
    precio_usd: parseNumber("1,2") || null,
    nota: "1 Tab x 10 Kg"
  },
  {
    nombre: "Well Cam 3",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,50") || null,
    precio_cup: parseNumber("750") || null,
    precio_usd: parseNumber("1,5") || null,
    nota: "1 Tab x 18 Kg"
  },
  {
    nombre: "Oxantel",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,30") || null,
    precio_cup: parseNumber("500") || null,
    precio_usd: parseNumber("1") || null,
    nota: "1 Tab x 5 Kg"
  },
  {
    nombre: "Tenibest",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,30") || null,
    precio_cup: parseNumber("500") || null,
    precio_usd: parseNumber("1") || null,
    nota: "1 Tab x 5Kg"
  },
  {
    nombre: "Tenibest",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("600") || null,
    precio_usd: parseNumber("1,2") || null,
    nota: "1ml x 5Kg"
  },
  {
    nombre: "Albendazol 700mg",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("500") || null,
    precio_usd: parseNumber("1") || null,
    nota: "1 Tab x 7Kg"
  },
  {
    nombre: "Praxtel",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,30") || null,
    precio_cup: parseNumber("600") || null,
    precio_usd: parseNumber("1,2") || null,
    nota: "1 ml x 5 Kg"
  },
  {
    nombre: "Pirantel",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,20") || null,
    precio_cup: parseNumber("600") || null,
    precio_usd: parseNumber("1,2") || null,
    nota: "1 ml x 5 Kg"
  },
  {
    nombre: "Levamisol",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "7 a 10 mg x kg"
  },
  {
    nombre: "Ivermectina1%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("150") || null,
    precio_usd: parseNumber("0,3") || null,
    nota: "1 ml x 50Kg"
  },
  {
    nombre: "Toltrasuril 5%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("100") || null,
    precio_usd: parseNumber("0,2") || null,
    nota: "1 ml x 5Kg"
  },
  {
    nombre: "Toltrasuril 2,5%",
    unidad: "ml",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("0,15") || null,
    precio_cup: parseNumber("100") || null,
    precio_usd: parseNumber("0,2") || null,
    nota: "1ml x 2.5Kg"
  },
  {
    nombre: "Simparica 5mg",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("1,00") || null,
    precio_cup: parseNumber("1500") || null,
    precio_usd: parseNumber("3") || null,
    nota: "2.5 - 5.5 Libras"
  },
  {
    nombre: "Simparica 10mg",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("1,00") || null,
    precio_cup: parseNumber("1500") || null,
    precio_usd: parseNumber("3") || null,
    nota: "5.5 - 11 Libras"
  },
  {
    nombre: "Simparica 20mg",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("2,00") || null,
    precio_cup: parseNumber("2500") || null,
    precio_usd: parseNumber("5") || null,
    nota: "11 - 22 Libras"
  },
  {
    nombre: "Simparica 40mg",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("4,00") || null,
    precio_cup: parseNumber("4000") || null,
    precio_usd: parseNumber("8") || null,
    nota: "22 - 44 Libras"
  },
  {
    nombre: "Simparica 80mg",
    unidad: "tab",
    clasificacion: "Medicamentos",
    sub: "Antiparasitarios",
    costo_cup: null,
    costo_usd: parseNumber("8,00") || null,
    precio_cup: parseNumber("8000") || null,
    precio_usd: parseNumber("16") || null,
    nota: "44 - 88 Libras"
  },

  // Biologicos - vacunas
  {
    nombre: "Parvovirus",
    unidad: "u",
    clasificacion: "Biologicos",
    sub: "vacunas",
    costo_cup: parseNumber("200") || null,
    costo_usd: null,
    precio_cup: parseNumber("500") || null,
    precio_usd: null,
    nota: ""
  },
  {
    nombre: "Pentavalente",
    unidad: "u",
    clasificacion: "Biologicos",
    sub: "vacunas",
    costo_cup: null,
    costo_usd: parseNumber("6.5") || null,
    precio_cup: null,
    precio_usd: parseNumber("10") || null,
    nota: ""
  },
  {
    nombre: "Hexavalente",
    unidad: "u",
    clasificacion: "Biologicos",
    sub: "vacunas",
    costo_cup: null,
    costo_usd: parseNumber("7,00") || null,
    precio_cup: null,
    precio_usd: parseNumber("10") || null,
    nota: ""
  },
  {
    nombre: "Rabia Virbac",
    unidad: "u",
    clasificacion: "Biologicos",
    sub: "vacunas",
    costo_cup: parseNumber("0") || null,
    costo_usd: null,
    precio_cup: parseNumber("250") || null,
    precio_usd: null,
    nota: ""
  },
  {
    nombre: "Rabia Americana monodosis",
    unidad: "u",
    clasificacion: "Biologicos",
    sub: "vacunas",
    costo_cup: null,
    costo_usd: parseNumber("17,00") || null,
    precio_cup: null,
    precio_usd: parseNumber("25") || null,
    nota: ""
  },
  {
    nombre: "Anticonseptivo",
    unidad: "u",
    clasificacion: "Biologicos",
    sub: "vacunas",
    costo_cup: null,
    costo_usd: parseNumber("3,50") || null,
    precio_cup: null,
    precio_usd: parseNumber("5") || null,
    nota: ""
  },

  // Microchip
  {
    nombre: "Microchip",
    unidad: "u",
    clasificacion: "Insumos",
    sub: "",
    costo_cup: null,
    costo_usd: parseNumber("4,00") || null,
    precio_cup: null,
    precio_usd: parseNumber("20,00") || null,
    nota: ""
  }
];

// Aplicar cálculos de valores faltantes
const datosProcesados = datosMedicamentos.map(item => {
  const valores = calcularValores(
    item.costo_cup,
    item.costo_usd,
    item.precio_cup,
    item.precio_usd
  );

  const tipoMedicamento = determinarTipoMedicamento(item);

  return {
    nombre: item.nombre,
    costo_usd: valores.costo_usd,
    costo_cup: valores.costo_cup,
    precio_usd: valores.precio_usd,
    precio_cup: valores.precio_cup,
    unidad: item.unidad,
    clasificacion: item.clasificacion,
    sub: item.sub || "",
    tipo_medicamento: tipoMedicamento,
    posologia: item.nota || ""
  };
});

const API_URL = "http://192.168.1.2:8787";
let authToken = "";

// Función para autenticar y obtener el token
async function autenticar() {
  const loginBody = {
    "nombre_usuario": "david",
    "contrasenna": "Floqui*0312"
  };

  try {
    console.log("🔐 Autenticando...");
    const response = await axios.post(`${API_URL}/usuario/login`, loginBody);

    if (response.data && response.data.token) {
      authToken = response.data.token;
      console.log("✅ Autenticación exitosa. Token obtenido.");
      return true;
    } else {
      console.log("❌ Error: No se recibió token en la respuesta");
      return false;
    }
  } catch (error) {
    console.log("❌ Error de autenticación:");
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Respuesta: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.log("No se recibió respuesta del servidor");
    } else {
      console.log(`Error: ${error.message}`);
    }
    return false;
  }
}

// Función para crear medicamento
async function crearMedicamento(item, codigo) {
  const medicamentoBody = {
    "nombre": item.nombre,
    "costo_usd": item.costo_usd.toString(),
    "costo_cup": item.costo_cup.toString(),
    "categoria": item.clasificacion,
    "nota": "", // Nota siempre vacía como especificaste
    "codigo": codigo,
    "precio_usd": item.precio_usd.toString(),
    "precio_cup": item.precio_cup.toString(),
    "roles_autorizados": "Administrador, Médico, Técnico, Estilista",
    "tipo_medicamento": item.tipo_medicamento,
    "unidad_medida": item.unidad || "",
    "posologia": item.posologia || ""
  };

  try {
    // Crear el medicamento
    const response = await axios.post(`${API_URL}/medicamento/CreateMedicamento`, medicamentoBody, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Extraer el id_comerciable de la respuesta
    let id_comerciable = null;

    if (response.data && response.data.id_comerciable) {
      id_comerciable = response.data.id_comerciable;
    } else if (response.data && response.data.medicamento && response.data.medicamento.id_comerciable) {
      id_comerciable = response.data.medicamento.id_comerciable;
    } else if (response.data && response.data.id) {
      id_comerciable = response.data.id;
    } else {
      console.log(`⚠️  Advertencia: No se pudo obtener id_comerciable para "${item.nombre}". Respuesta:`, JSON.stringify(response.data));
      return { success: false, error: "No se obtuvo id_comerciable de la respuesta" };
    }

    console.log(`✅ ${item.nombre} (Código: ${codigo}) - Tipo: ${item.tipo_medicamento} - ID: ${id_comerciable} - Creado`);
    console.log(`   💰 Costo: $${item.costo_usd.toFixed(2)}/₡${item.costo_cup} | Precio: $${item.precio_usd.toFixed(2)}/₡${item.precio_cup}`);
    if (item.posologia) {
      console.log(`   📝 Posología: ${item.posologia}`);
    }

    return { success: true, id_comerciable: id_comerciable, data: response.data };

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

// Función principal para crear todos los medicamentos
// Función principal para crear todos los medicamentos
async function crearTodosMedicamentos() {
  console.log(`🔧 Iniciando proceso de creación de ${datosProcesados.length} medicamentos...\n`);

  // Primero autenticar
  const autenticado = await autenticar();
  if (!autenticado) {
    console.log("❌ No se pudo autenticar. Abortando proceso.");
    return;
  }

  let exitosos = 0;
  let fallidos = 0;
  let codigoBase = 96; // CAMBIADO: Empieza desde 96 para evitar conflictos con productos

  console.log("🚀 Comenzando creación de medicamentos...\n");

  for (let i = 0; i < datosProcesados.length; i++) {
    const item = datosProcesados[i];
    const codigo = codigoBase + i;

    console.log(`🔹 Procesando ${i + 1}/${datosProcesados.length}: ${item.nombre}...`);

    const resultado = await crearMedicamento(item, codigo);

    if (resultado.success) {
      exitosos++;
    } else {
      fallidos++;
    }

    // Pausa entre solicitudes para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`\n📊 RESULTADO FINAL:`);
  console.log(`✅ ${exitosos} medicamentos creados exitosamente`);
  console.log(`❌ ${fallidos} medicamentos fallaron`);
  console.log(`💰 Tasa de cambio utilizada: 500 CUP = 1 USD`);

  // Resumen financiero
  const totalCostoUSD = datosProcesados.reduce((sum, item) => sum + item.costo_usd, 0);
  const totalCostoCUP = datosProcesados.reduce((sum, item) => sum + item.costo_cup, 0);
  const totalPrecioUSD = datosProcesados.reduce((sum, item) => sum + item.precio_usd, 0);
  const totalPrecioCUP = datosProcesados.reduce((sum, item) => sum + item.precio_cup, 0);

  console.log(`\n💰 RESUMEN FINANCIERO:`);
  console.log(`💵 Costo total: $${totalCostoUSD.toFixed(2)} / ₡${totalCostoCUP}`);
  console.log(`💰 Valor total (precio de venta): $${totalPrecioUSD.toFixed(2)} / ₡${totalPrecioCUP}`);
  console.log(`📈 Ganancia potencial: $${(totalPrecioUSD - totalCostoUSD).toFixed(2)} / ₡${totalPrecioCUP - totalCostoCUP}`);

  // Resumen por tipo de medicamento
  const tipos = {};
  datosProcesados.forEach(item => {
    if (!tipos[item.tipo_medicamento]) {
      tipos[item.tipo_medicamento] = 0;
    }
    tipos[item.tipo_medicamento]++;
  });

  console.log(`\n📦 DISTRIBUCIÓN POR TIPO DE MEDICAMENTO:`);
  for (const [tipo, cantidad] of Object.entries(tipos)) {
    console.log(`   ${tipo}: ${cantidad} medicamentos`);
  }

  if (fallidos === 0) {
    console.log("\n🎉 ¡Todos los medicamentos fueron creados exitosamente!");
  } else {
    console.log("\n⚠️  Algunos medicamentos fallaron. Revisar los mensajes de error.");
  }
}

// Ejecutar el proceso principal
crearTodosMedicamentos();