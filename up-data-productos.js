const axios = require('axios');

// Función para convertir valores con coma decimal a números
function parseNumber(str) {
  if (!str || str.trim() === '') return null;
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

// Datos de productos extraídos del Excel (incluyendo todos los proporcionados)
const datos = [
  // Sueros (nuevos productos que se quedaron)
  { 
    nombre: "Dextrosa 5%", 
    costo_cup: parseNumber("350") || null, 
    costo_usd: null,
    precio_cup: parseNumber("350") || null, 
    precio_usd: parseNumber("0,7") || null,
    unidad: "u",
    categoria: "suero"
  },
  { 
    nombre: "Dextrosa x%", 
    costo_cup: null, 
    costo_usd: null,
    precio_cup: null, 
    precio_usd: 0,
    unidad: "u",
    categoria: "suero"
  },
  { 
    nombre: "Solución Salina Fisiologica 0,9%", 
    costo_cup: parseNumber("400") || null, 
    costo_usd: null,
    precio_cup: parseNumber("400") || null, 
    precio_usd: parseNumber("0,8") || null,
    unidad: "u",
    categoria: "suero"
  },
  { 
    nombre: "Solución Salina Fisiologica x%", 
    costo_cup: null, 
    costo_usd: null,
    precio_cup: null, 
    precio_usd: 0,
    unidad: "u",
    categoria: "suero"
  },
  { 
    nombre: "Ringer", 
    costo_cup: parseNumber("500") || null, 
    costo_usd: null,
    precio_cup: parseNumber("500") || null, 
    precio_usd: parseNumber("1") || null,
    unidad: "u",
    categoria: "suero"
  },
  { 
    nombre: "Agua para inyección", 
    costo_cup: parseNumber("350") || null, 
    costo_usd: null,
    precio_cup: null, 
    precio_usd: 0,
    unidad: "u",
    categoria: "suero"
  },
  { 
    nombre: "Manitol", 
    costo_cup: null, 
    costo_usd: null,
    precio_cup: null, 
    precio_usd: 0,
    unidad: "u",
    categoria: "suero"
  },
  { 
    nombre: "Gel Fusin", 
    costo_cup: null, 
    costo_usd: null,
    precio_cup: null, 
    precio_usd: 0,
    unidad: "u",
    categoria: "suero"
  },
  { 
    nombre: "Dextrano", 
    costo_cup: null, 
    costo_usd: null,
    precio_cup: null, 
    precio_usd: 0,
    unidad: "u",
    categoria: "suero"
  },
  { 
    nombre: "Aminoplasma", 
    costo_cup: null, 
    costo_usd: null,
    precio_cup: null, 
    precio_usd: 0,
    unidad: "u",
    categoria: "suero"
  },
  { 
    nombre: "Lipofundin", 
    costo_cup: null, 
    costo_usd: null,
    precio_cup: null, 
    precio_usd: 0,
    unidad: "u",
    categoria: "suero"
  },
  
  // Accesorios anteriores
  { 
    nombre: "Collar 10", 
    costo_usd: parseNumber("0,95") || 0,
    costo_cup: null,
    precio_usd: parseNumber("3,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Collar 15", 
    costo_usd: parseNumber("1,06") || 0,
    costo_cup: null,
    precio_usd: parseNumber("4,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Collar 20", 
    costo_usd: parseNumber("0,95") || 0,
    costo_cup: null,
    precio_usd: parseNumber("5,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Collar 25", 
    costo_usd: parseNumber("1,61") || 0,
    costo_cup: null,
    precio_usd: parseNumber("6,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Collar 30", 
    costo_usd: parseNumber("1,45") || 0,
    costo_cup: null,
    precio_usd: parseNumber("8,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Collar 35", 
    costo_usd: parseNumber("1,40") || 0,
    costo_cup: null,
    precio_usd: parseNumber("8,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Collar silicona", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: parseNumber("2,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Collar XX", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Pechera 10", 
    costo_usd: parseNumber("3,29") || 0,
    costo_cup: null,
    precio_usd: parseNumber("8,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Pechera 15", 
    costo_usd: parseNumber("4,00") || 0,
    costo_cup: null,
    precio_usd: parseNumber("10,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Pechera 20", 
    costo_usd: parseNumber("4,01") || 0,
    costo_cup: null,
    precio_usd: parseNumber("12,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Pechera 25", 
    costo_usd: parseNumber("4,96") || 0,
    costo_cup: null,
    precio_usd: parseNumber("14,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Pechera 30", 
    costo_usd: parseNumber("5,05") || 0,
    costo_cup: null,
    precio_usd: parseNumber("18,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Pechera 35", 
    costo_usd: parseNumber("6,00") || 0,
    costo_cup: null,
    precio_usd: parseNumber("18,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Pechera XX", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Trailla 10", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Trailla 15", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Trailla 20", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Trailla 25", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Trailla 30", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Trailla 35", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Trailla tubular fina", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: parseNumber("7,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Trailla tubular media", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: parseNumber("8,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Trailla tubular gruesa", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: parseNumber("9,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Trailla Retractil", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: parseNumber("10,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Comedero Metalico 12", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Comedero Metalico 16", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Comedero Metalico 18", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: parseNumber("5,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Comedero Metalico 22", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: parseNumber("6,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Comedero Metalico 26", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: parseNumber("7,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Comedero Metalico 30", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: parseNumber("9,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Comedero Plastico", 
    costo_usd: parseNumber("1,70") || 0,
    costo_cup: null,
    precio_usd: parseNumber("4,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Comedero Doble", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: parseNumber("3,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Kennel S", 
    costo_usd: parseNumber("18,00") || 0,
    costo_cup: null,
    precio_usd: parseNumber("35,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Kennel M", 
    costo_usd: parseNumber("20,00") || 0,
    costo_cup: null,
    precio_usd: parseNumber("35,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Kennel L", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Kennel Esclusivo", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Kennel Rigido talla", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Juguetes hule", 
    costo_usd: parseNumber("1,40") || 0,
    costo_cup: null,
    precio_usd: parseNumber("3,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "Juguetes Silicona", 
    costo_usd: parseNumber("2,03") || 0,
    costo_cup: null,
    precio_usd: parseNumber("4,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "bosal plasticos", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "bosal silicona", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "cepillo dental", 
    costo_usd: null,
    costo_cup: parseNumber("250,00") || 0,
    precio_usd: 0,
    precio_cup: 0,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "collar isabelino talla pequeña", 
    costo_usd: parseNumber("1,30") || 0,
    costo_cup: null,
    precio_usd: parseNumber("1,70") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "collar isabelino talla grande", 
    costo_usd: parseNumber("2,50") || 0,
    costo_cup: null,
    precio_usd: parseNumber("5,00") || 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "peines metalicos", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "peine de mantequilla", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "chapa metalica identificador", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "cama pequeña", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "cama grande", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "camiseta con manga", 
    costo_usd: null,
    costo_cup: parseNumber("500,00") || 0,
    precio_usd: null,
    precio_cup: parseNumber("1000,00") || 0,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "camiseta sin manga", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  { 
    nombre: "vestidos", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "accesorio"
  },
  
  // Nuevos productos de insumos
  { 
    nombre: "Algodón", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Gasa", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Apositos pequeño", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Apositos mediano", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Apositos grande", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Torunda", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Yeso", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "rollo",
    categoria: "insumo"
  },
  { 
    nombre: "Guata p yeso", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "rollo",
    categoria: "insumo"
  },
  { 
    nombre: "Esparadrapo", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "rollo",
    categoria: "insumo"
  },
  { 
    nombre: "Viales 0,1", 
    costo_usd: 0,
    costo_cup: null,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Viales 0,5", 
    costo_usd: null,
    costo_cup: parseNumber("4,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Viales 1,5", 
    costo_usd: null,
    costo_cup: parseNumber("5,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Viales 4,0", 
    costo_usd: null,
    costo_cup: parseNumber("5,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Bisturis", 
    costo_usd: null,
    costo_cup: parseNumber("20,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Hilo Nylon", 
    costo_usd: null,
    costo_cup: parseNumber("150,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Hilo Seda", 
    costo_usd: null,
    costo_cup: parseNumber("150,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Hilo Catgut", 
    costo_usd: null,
    costo_cup: parseNumber("150,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Hilo Sintetico reabsorvible", 
    costo_usd: null,
    costo_cup: parseNumber("150,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Hilo Sintetico no reabsorvible", 
    costo_usd: null,
    costo_cup: parseNumber("150,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Venoclip", 
    costo_usd: null,
    costo_cup: parseNumber("100,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Agujas", 
    costo_usd: null,
    costo_cup: parseNumber("20,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Mochitas", 
    costo_usd: null,
    costo_cup: parseNumber("50,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Branulas", 
    costo_usd: null,
    costo_cup: parseNumber("150,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Jeringas 1ml", 
    costo_usd: null,
    costo_cup: parseNumber("30,00") || 0,
    precio_usd: null,
    precio_cup: parseNumber("50,00") || 0,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Jeringas 2,5ml", 
    costo_usd: null,
    costo_cup: parseNumber("30,00") || 0,
    precio_usd: null,
    precio_cup: parseNumber("50,00") || 0,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Jeringas 3ml", 
    costo_usd: null,
    costo_cup: parseNumber("30,00") || 0,
    precio_usd: null,
    precio_cup: parseNumber("50,00") || 0,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Jeringas 5ml", 
    costo_usd: null,
    costo_cup: parseNumber("30,00") || 0,
    precio_usd: null,
    precio_cup: parseNumber("50,00") || 0,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Jeringas 10ml", 
    costo_usd: null,
    costo_cup: parseNumber("30,00") || 0,
    precio_usd: null,
    precio_cup: parseNumber("50,00") || 0,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Jeringas 20ml", 
    costo_usd: null,
    costo_cup: parseNumber("30,00") || 0,
    precio_usd: null,
    precio_cup: parseNumber("50,00") || 0,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Jeringas 50ml", 
    costo_usd: null,
    costo_cup: parseNumber("150,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  },
  { 
    nombre: "Sonda", 
    costo_usd: null,
    costo_cup: parseNumber("150,00") || 0,
    precio_usd: 0,
    precio_cup: null,
    unidad: "u",
    categoria: "insumo"
  }
];

// Aplicar cálculos de valores faltantes
const datosProcesados = datos.map(item => {
  const valores = calcularValores(
    item.costo_cup, 
    item.costo_usd, 
    item.precio_cup, 
    item.precio_usd
  );
  
  return {
    nombre: item.nombre,
    costo_usd: valores.costo_usd,
    costo_cup: valores.costo_cup,
    precio_usd: valores.precio_usd,
    precio_cup: valores.precio_cup,
    unidad: item.unidad,
    categoria: item.categoria || "accesorio" // Valor por defecto
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

// Función para crear producto
async function crearProducto(item, codigo) {
  const productoBody = {
    "nombre": item.nombre,
    "costo_usd": item.costo_usd.toString(),
    "costo_cup": item.costo_cup.toString(),
    "categoria": item.categoria,
    "nota": "",
    "codigo": codigo,
    "precio_usd": item.precio_usd.toString(),
    "precio_cup": item.precio_cup.toString(),
    "roles_autorizados": "Administrador, Médico, Técnico, Estilista"
  };
  
  try {
    // Crear el producto
    const response = await axios.post(`${API_URL}/producto/CreateProducto`, productoBody, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Extraer el id_comerciable de la respuesta
    let id_comerciable = null;
    
    if (response.data && response.data.id_comerciable) {
      id_comerciable = response.data.id_comerciable;
    } else if (response.data && response.data.producto && response.data.producto.id_comerciable) {
      id_comerciable = response.data.producto.id_comerciable;
    } else if (response.data && response.data.id) {
      id_comerciable = response.data.id;
    } else {
      console.log(`⚠️  Advertencia: No se pudo obtener id_comerciable para "${item.nombre}". Respuesta:`, JSON.stringify(response.data));
      return { success: false, error: "No se obtuvo id_comerciable de la respuesta" };
    }
    
    console.log(`✅ ${item.nombre} (Código: ${codigo}) - ID: ${id_comerciable} - Creado`);
    console.log(`   💰 Costo: $${item.costo_usd.toFixed(2)}/₡${item.costo_cup} | Precio: $${item.precio_usd.toFixed(2)}/₡${item.precio_cup} | Categoría: ${item.categoria}`);
    
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

// Función principal para crear todos los productos
async function crearTodosProductos() {
  console.log(`🔧 Iniciando proceso de creación de ${datosProcesados.length} productos...\n`);
  
  // Primero autenticar
  const autenticado = await autenticar();
  if (!autenticado) {
    console.log("❌ No se pudo autenticar. Abortando proceso.");
    return;
  }
  
  let exitosos = 0;
  let fallidos = 0;
  let codigoBase = 1; // Empieza desde 1
  
  console.log("🚀 Comenzando creación de productos...\n");
  
  for (let i = 0; i < datosProcesados.length; i++) {
    const item = datosProcesados[i];
    const codigo = codigoBase + i;
    
    console.log(`🔹 Procesando ${i + 1}/${datosProcesados.length}: ${item.nombre}...`);
    
    const resultado = await crearProducto(item, codigo);
    
    if (resultado.success) {
      exitosos++;
    } else {
      fallidos++;
    }
    
    // Pausa entre solicitudes para no sobrecargar el servidor
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`\n📊 RESULTADO FINAL:`);
  console.log(`✅ ${exitosos} productos creados exitosamente`);
  console.log(`❌ ${fallidos} productos fallaron`);
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
  
  // Resumen por categoría
  const categorias = {};
  datosProcesados.forEach(item => {
    if (!categorias[item.categoria]) {
      categorias[item.categoria] = 0;
    }
    categorias[item.categoria]++;
  });
  
  console.log(`\n📦 DISTRIBUCIÓN POR CATEGORÍA:`);
  for (const [categoria, cantidad] of Object.entries(categorias)) {
    console.log(`   ${categoria}: ${cantidad} productos`);
  }
  
  if (fallidos === 0) {
    console.log("\n🎉 ¡Todos los productos fueron creados exitosamente!");
  } else {
    console.log("\n⚠️  Algunos productos fallaron. Revisar los mensajes de error.");
  }
}

// Ejecutar el proceso principal
crearTodosProductos();