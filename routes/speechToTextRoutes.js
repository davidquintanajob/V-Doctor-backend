const express = require('express');
const router = express.Router();
// ESTO ESTÁ MAL - debería ser speechToTextController, NO transcribeController
const speechToTextController = require('../controllers/speechToTextController'); // <-- CORREGIR
const authenticate = require('../helpers/authenticate');

/**
 * @swagger
 * tags:
 *   name: SpeechToText
 *   description: API para reconocimiento de voz en tiempo real usando Whisper
 */

/**
 * @swagger
 * /api/speech-to-text/status:
 *   get:
 *     summary: Obtener estado del servicio de reconocimiento de voz (Whisper)
 *     tags: [SpeechToText]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del servicio Whisper
 *       503:
 *         description: Servicio no disponible
 *       500:
 *         description: Error interno del servidor
 */
router.get('/api/speech-to-text/status', authenticate(), speechToTextController.getServiceStatus);

/**
 * @swagger
 * /api/speech-to-text/test-file:
 *   post:
 *     summary: Probar transcripción con un archivo de audio (para testing)
 *     tags: [SpeechToText]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - audioBase64
 *             properties:
 *               audioBase64:
 *                 type: string
 *                 description: Audio en formato base64 (WAV preferiblemente)
 *     responses:
 *       200:
 *         description: Transcripción exitosa
 *       400:
 *         description: Audio no proporcionado
 *       503:
 *         description: Whisper no disponible
 *       500:
 *         description: Error en la transcripción
 */
router.post('/api/speech-to-text/test-file', authenticate(), speechToTextController.testTranscriptionFile);

/**
 * @swagger
 * /api/speech-to-text/test-installation:
 *   get:
 *     summary: Probar la instalación de Whisper.cpp
 *     tags: [SpeechToText]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resultado de la prueba de instalación
 *       500:
 *         description: Error interno
 */
router.get('/api/speech-to-text/test-installation', authenticate(), speechToTextController.testInstallation);

module.exports = router;