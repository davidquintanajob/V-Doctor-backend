// ============================================
// 1. CONFIGURACIÓN INICIAL CRÍTICA - DEBE IR PRIMERO
// ============================================
const path = require('path');
const fs = require('fs').promises;

// FORZAR la carpeta de caché ANTES de cualquier import
const PROJECT_ROOT = path.resolve(__dirname, '..'); // Raíz del proyecto backend
const MODEL_CACHE_DIR = path.join(PROJECT_ROOT, 'models_cache');

// 1. Eliminar caché previa de Node.js para transformers
Object.keys(require.cache).forEach(key => {
    if (key.includes('@xenova/transformers')) {
        delete require.cache[key];
    }
});

// 2. Establecer variable de entorno PRIMERO
process.env.TRANSFORMERS_CACHE = MODEL_CACHE_DIR;
process.env.TRANSFORMERS_OFFLINE = '0'; // Permitir descarga si no existe

console.log(`🚀 Configuración forzada:`);
console.log(`📁 Caché: ${MODEL_CACHE_DIR}`);
console.log(`📁 Raíz proyecto: ${PROJECT_ROOT}`);

// ============================================
// 2. AHORA importar dependencias
// ============================================
const { pipeline } = require('@xenova/transformers');
const WaveFile = require('wavefile').WaveFile;
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { Readable } = require('stream');

// Configurar ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// ============================================
// 3. FUNCIÓN PARA VERIFICAR/MOVER CACHÉ EXISTENTE
// ============================================
async function setupModelCache() {
    try {
        // Asegurar que la carpeta existe
        await fs.mkdir(MODEL_CACHE_DIR, { recursive: true });
        
        // Verificar si ya hay caché en ubicaciones predeterminadas
        const defaultCachePaths = [
            path.join(require('os').homedir(), '.cache', 'huggingface', 'hub'),
            path.join(require('os').homedir(), 'AppData', 'Local', 'huggingface'),
            path.join(require('os').tmpdir(), 'huggingface')
        ];
        
        let foundExistingCache = false;
        
        for (const cachePath of defaultCachePaths) {
            try {
                await fs.access(cachePath);
                const files = await fs.readdir(cachePath);
                
                // Buscar modelo de whisper
                const whisperCache = files.find(f => f.includes('whisper-small') || f.includes('Xenova'));
                
                if (whisperCache) {
                    console.log(`🔍 Encontrado caché existente en: ${cachePath}`);
                    console.log(`   Modelo: ${whisperCache}`);
                    
                    // Copiar a nuestra carpeta local si no existe
                    const sourceDir = path.join(cachePath, whisperCache);
                    const targetDir = path.join(MODEL_CACHE_DIR, whisperCache);
                    
                    try {
                        await fs.access(targetDir);
                        console.log(`✅ Modelo ya está en caché local`);
                    } catch {
                        console.log(`📥 Copiando caché existente a carpeta del proyecto...`);
                        await copyDir(sourceDir, targetDir);
                        console.log(`✅ Caché copiada a: ${targetDir}`);
                    }
                    
                    foundExistingCache = true;
                    break;
                }
            } catch (err) {
                // La carpeta no existe, continuar
            }
        }
        
        if (!foundExistingCache) {
            console.log(`📭 No se encontró caché existente. Se descargará al primer uso.`);
        }
        
        return MODEL_CACHE_DIR;
    } catch (error) {
        console.error('❌ Error configurando caché:', error);
        throw error;
    }
}

// Función auxiliar para copiar directorios
async function copyDir(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

// ============================================
// 4. INICIALIZAR CACHÉ AL CARGAR EL MÓDULO
// ============================================
let cacheInitialized = false;
async function initializeCache() {
    if (!cacheInitialized) {
        await setupModelCache();
        cacheInitialized = true;
        console.log(`✅ Caché inicializada en: ${MODEL_CACHE_DIR}`);
    }
}

// Ejecutar inicialización (pero no bloquear)
initializeCache().catch(err => {
    console.error('⚠️  Error inicializando caché:', err.message);
});

// ============================================
// 5. TRANSCRIBER CON VERIFICACIÓN DE CACHÉ
// ============================================
let transcriber = null;

async function getTranscriber() {
    if (!transcriber) {
        try {
            // Asegurar que la caché está lista
            await initializeCache();
            
            console.log(`⏳ Cargando modelo Whisper desde: ${MODEL_CACHE_DIR}`);
            
            // Verificar contenido de la carpeta de caché
            const cacheContent = await fs.readdir(MODEL_CACHE_DIR);
            console.log(`📁 Contenido de caché (${cacheContent.length} items):`, 
                cacheContent.slice(0, 5).join(', '));
            
            // Cargar pipeline con configuración explícita
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small');
            
            // Verificar dónde quedó realmente el modelo
            const finalCacheContent = await fs.readdir(MODEL_CACHE_DIR);
            if (finalCacheContent.length > 0) {
                const modelSize = await getFolderSize(path.join(MODEL_CACHE_DIR, finalCacheContent[0]));
                console.log(`✅ Modelo cargado. Tamaño: ${(modelSize / 1024 / 1024).toFixed(2)} MB`);
                console.log(`📍 Ubicación real: ${MODEL_CACHE_DIR}/${finalCacheContent[0]}`);
            } else {
                console.log(`⚠️  La carpeta de caché sigue vacía. El modelo está en otra ubicación.`);
            }
            
        } catch (error) {
            console.error('❌ Error fatal al cargar el modelo:', error);
            
            // Diagnóstico detallado
            console.log('🔍 Diagnóstico:');
            console.log('- TRANSFORMERS_CACHE:', process.env.TRANSFORMERS_CACHE);
            console.log('- Existe carpeta:', await fs.access(MODEL_CACHE_DIR).then(() => 'SÍ').catch(() => 'NO'));
            
            throw error;
        }
    }
    return transcriber;
}

// Función para calcular tamaño de carpeta
async function getFolderSize(folderPath) {
    try {
        const files = await fs.readdir(folderPath, { withFileTypes: true });
        let size = 0;
        
        for (const file of files) {
            const filePath = path.join(folderPath, file.name);
            if (file.isDirectory()) {
                size += await getFolderSize(filePath);
            } else {
                const stats = await fs.stat(filePath);
                size += stats.size;
            }
        }
        return size;
    } catch {
        return 0;
    }
}

// ============================================
// 6. FUNCIONES DE TRANSCRIPCIÓN (IGUAL)
// ============================================
async function transcribeWithTransformers(audioBuffer) {
    try {
        const transcriber = await getTranscriber();
        console.log(`🔍 Buffer recibido: ${audioBuffer.length} bytes`);

        const format = detectAudioFormat(audioBuffer);
        console.log(`📁 Formato detectado: ${format}`);

        const convertedBuffer = await new Promise((resolve, reject) => {
            const chunks = [];
            const audioStream = Readable.from(audioBuffer);
            const ffmpegCmd = ffmpeg(audioStream);

            if (format === 'mp4' || format === 'm4a') {
                ffmpegCmd.inputFormat('mp4');
            } else if (format === 'wav') {
                ffmpegCmd.inputFormat('wav');
            }

            ffmpegCmd
                .audioFrequency(16000)
                .audioChannels(1)
                .audioCodec('pcm_s16le')
                .format('wav')
                .on('start', (commandLine) => {
                    console.log(`🔄 Iniciando conversión: ${commandLine}`);
                })
                .on('error', (err, stdout, stderr) => {
                    console.error('❌ Error FFmpeg completo:');
                    console.error('Mensaje:', err.message);
                    console.error('stderr:', stderr);
                    reject(new Error(`Error FFmpeg: ${err.message}`));
                })
                .on('end', () => {
                    const result = Buffer.concat(chunks);
                    console.log(`✅ Audio convertido: ${result.length} bytes`);
                    resolve(result);
                })
                .pipe()
                .on('data', (chunk) => chunks.push(chunk));
        });

        const wav = new WaveFile(convertedBuffer);
        wav.toBitDepth('32f');

        let audioData = wav.getSamples();
        if (Array.isArray(audioData)) {
            audioData = audioData[0];
        }

        const output = await transcriber(audioData, {
            language: 'spanish',
            task: 'transcribe'
        });

        return output.text;
    } catch (error) {
        console.error('❌ Error en transcribeWithTransformers:', error);
        throw error;
    }
}

function detectAudioFormat(buffer) {
    if (buffer.length < 12) return 'unknown';
    const hex = buffer.toString('hex', 0, 12);
    
    if (hex.startsWith('00000018667479706d703432')) return 'mp4';
    if (hex.startsWith('667479704d3441')) return 'm4a';
    if (hex.startsWith('52494646')) return 'wav';
    if (hex.startsWith('494433')) return 'mp3';
    
    return 'unknown';
}

// ============================================
// 7. CONTROLADORES MEJORADOS CON INFO DE CACHÉ
// ============================================
const getServiceStatus = async (req, res) => {
    try {
        let modelStatus = 'NO_CARGADO';
        let cacheInfo = { exists: false, size: '0 MB', location: MODEL_CACHE_DIR };
        
        try {
            await initializeCache();
            
            // Verificar estado de la caché
            cacheInfo.exists = await fs.access(MODEL_CACHE_DIR).then(() => true).catch(() => false);
            
            if (cacheInfo.exists) {
                const files = await fs.readdir(MODEL_CACHE_DIR);
                cacheInfo.fileCount = files.length;
                
                if (files.length > 0) {
                    const modelFolder = path.join(MODEL_CACHE_DIR, files[0]);
                    const size = await getFolderSize(modelFolder);
                    cacheInfo.size = `${(size / 1024 / 1024).toFixed(2)} MB`;
                    cacheInfo.modelFolder = files[0];
                }
            }
            
            // Intentar cargar el modelo
            const transcriber = await getTranscriber();
            modelStatus = 'CARGADO';
            
        } catch (error) {
            modelStatus = `ERROR: ${error.message}`;
        }

        res.status(200).json({
            success: true,
            data: {
                available: modelStatus === 'CARGADO',
                engine: 'Transformers.js (Whisper) + FFmpeg',
                model: 'Xenova/whisper-small',
                cache: cacheInfo,
                modelStatus: modelStatus,
                language: 'es',
                timestamp: new Date().toISOString(),
                note: 'El modelo se guarda en la carpeta del proyecto para fácil despliegue'
            },
            message: modelStatus === 'CARGADO' ? 
                '✅ Servicio listo. Modelo en carpeta del proyecto.' :
                '⚠️  Servicio en estado de verificación.'
        });
    } catch (error) {
        console.error('Error en getServiceStatus:', error);
        res.status(500).json({ success: false, error: 'Error interno', details: error.message });
    }
};

const testTranscriptionFile = async (req, res) => {
    const startTime = Date.now();
    
    try {
        if (!req.body?.audioBase64) {
            return res.status(400).json({ success: false, error: 'Se requiere audioBase64' });
        }

        let audioBase64 = req.body.audioBase64;
        if (audioBase64.includes('base64,')) {
            audioBase64 = audioBase64.split('base64,')[1];
        }

        const buffer = Buffer.from(audioBase64, 'base64');
        
        console.log('🎤 Iniciando transcripción...');
        const transcription = await transcribeWithTransformers(buffer);
        const processingTime = Date.now() - startTime;

        console.log(`✅ Transcripción completada en ${processingTime}ms`);
        
        res.status(200).json({
            success: true,
            data: {
                transcription: transcription,
                processingTime: `${processingTime}ms`,
                timestamp: new Date().toISOString(),
                engine: 'Transformers.js + FFmpeg',
                model: 'Xenova/whisper-small',
                cacheLocation: MODEL_CACHE_DIR
            }
        });
        
    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ Error en testTranscriptionFile:', error);
        
        res.status(500).json({
            success: false,
            error: 'Error en la transcripción',
            details: error.message,
            processingTime: `${processingTime}ms`
        });
    }
};

const testInstallation = async (req, res) => {
    try {
        let modelLoadResult = { success: false };
        let cacheDetails = { location: MODEL_CACHE_DIR, exists: false, content: [] };
        
        try {
            await initializeCache();
            cacheDetails.exists = await fs.access(MODEL_CACHE_DIR).then(() => true).catch(() => false);
            
            if (cacheDetails.exists) {
                cacheDetails.content = await fs.readdir(MODEL_CACHE_DIR);
            }
            
            const transcriber = await getTranscriber();
            modelLoadResult = { success: true, status: 'FUNCIONAL' };
        } catch (error) {
            modelLoadResult = { success: false, error: error.message, status: 'ERROR' };
        }

        res.status(200).json({
            success: true,
            data: {
                installation: {
                    'transformers.js': true,
                    'wavefile': true,
                    'fluent-ffmpeg': true,
                    'ffmpeg-installer': true,
                    'whisper-model': modelLoadResult.success ? 'CARGADO' : 'NO_CARGADO',
                    'cache-folder': cacheDetails.location,
                    'cache-exists': cacheDetails.exists,
                    'cache-items': cacheDetails.content.length
                },
                cacheDetails: cacheDetails,
                modelLoadTest: modelLoadResult,
                system: { platform: process.platform, arch: process.arch, node: process.version },
                summary: modelLoadResult.success ? 
                    '✅ Sistema completo. Modelo en carpeta del proyecto.' : 
                    '❌ Instalación incompleta.',
                deploymentInstructions: [
                    `1. La carpeta '${MODEL_CACHE_DIR}' contiene el modelo.`,
                    '2. Para producción: COPIA esta carpeta completa.',
                    `3. En el servidor: asegura permisos de LECTURA en '${MODEL_CACHE_DIR}'.`,
                    '4. No se requerirá descargar el modelo nuevamente.'
                ]
            }
        });
    } catch (error) {
        console.error('Error en testInstallation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getServiceStatus,
    testTranscriptionFile,
    testInstallation
};