const axios = require('axios');

const datos = [
  "Collar 10", "Collar 15", "Collar 20", "Collar 25", "Collar 30", "Collar 35",
  "Collar silicona", "Collar XX", "Pechera 10", "Pechera 15", "Pechera 20",
  "Pechera 25", "Pechera 30", "Pechera 35", "Pechera XX", "Trailla 10",
  "Trailla 15", "Trailla 20", "Trailla 25", "Trailla 30", "Trailla 35",
  "Trailla tubular fina", "Trailla tubular media", "Trailla tubular gruesa",
  "Trailla Retractil", "Comedero Metalico", "Comedero Plastico",
  "Comedero Doble", "Kennel S", "Kennel M", "Kennel L", "Kennel Esclusivo",
  "Kennel Rigido talla", "Juguetes hule", "Juguetes Silicona"
];

const API_URL = "http://192.168.1.200:4000";

async function crearProducto(item, codigo) {
  const body = {
    "nombre": item,
    "costo_usd": "0",
    "costo_cup": "0",
    "categoria": "accesorio",
    "nota": "",
    "codigo": codigo,
    "precio_usd": "0",
    "precio_cup": "0",
    "roles_autorizados": "Administrador, Médico, Técnico, Estilista"
  };
  
  try {
    const response = await axios.post(`${API_URL}/producto/CreateProducto`, body);
    console.log(`✅ ${item} (Código: ${codigo}) creado`);
    return { success: true, data: response.data };
  } catch (error) {
    let errorMessage = 'Error desconocido';
    
    if (error.response) {
      // El servidor respondió con un error
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
      
      console.log(`❌ Error ${status} al crear "${item}" (Código: ${codigo}): ${errorMessage}`);
    } else if (error.request) {
      // La solicitud se hizo pero no hubo respuesta
      errorMessage = 'No se recibió respuesta del servidor';
      console.log(`❌ Sin respuesta del servidor para "${item}": ${error.message}`);
    } else {
      // Error al configurar la solicitud
      errorMessage = error.message;
      console.log(`❌ Error de configuración para "${item}": ${error.message}`);
    }
    
    return { success: false, error: errorMessage };
  }
}

async function crearTodosProductos() {
  console.log(`Creando ${datos.length} productos...\n`);
  
  let exitosos = 0;
  let fallidos = 0;
  
  for (let i = 0; i < datos.length; i++) {
    const resultado = await crearProducto(datos[i], i + 1);
    
    if (resultado.success) {
      exitosos++;
    } else {
      fallidos++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Resultado:`);
  console.log(`✅ ${exitosos} productos creados exitosamente`);
  console.log(`❌ ${fallidos} productos fallaron`);
}

crearTodosProductos();
//