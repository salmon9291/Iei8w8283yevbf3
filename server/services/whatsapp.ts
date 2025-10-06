import whatsappWeb from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { generateChatResponse } from './gemini';
import { exec } from 'child_process';
import { promisify } from 'util';
import { storage } from '../storage';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const { Client, LocalAuth, MessageMedia } = whatsappWeb;

class WhatsAppService {
  private client: InstanceType<typeof Client> | null = null;
  private qrCode: string = '';
  private pairingCode: string = '';
  private isReady: boolean = false;
  private isConnecting: boolean = false;
  private isInitialized: boolean = false;
  private usePairingCode: boolean = false;
  private customPrompt: string = '';

  constructor() {}

  private async downloadYouTubeVideo(url: string): Promise<string | null> {
    try {
      // Crear directorio de descargas si no existe
      const downloadsDir = path.join(process.cwd(), 'downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      // Generar nombre de archivo único
      const outputFileName = `video_${Date.now()}.mp4`;
      const outputPath = path.join(downloadsDir, outputFileName);

      // Usar yt-dlp para descargar el video con múltiples intentos de formato
      // Opciones para evitar restricciones de YouTube:
      // --extractor-args "youtube:player_client=android" : usar cliente Android para evitar restricciones
      // -f "best[ext=mp4][filesize<64M]/worst[ext=mp4]" : formato simple que suele funcionar mejor
      // --merge-output-format mp4 : forzar salida en mp4
      // --no-playlist : solo descargar un video
      // --max-filesize 64M : limitar tamaño
      // -o : especificar ruta de salida
      const command = `yt-dlp --extractor-args "youtube:player_client=android" -f "best[ext=mp4][filesize<64M]/worst[ext=mp4]" --merge-output-format mp4 --no-playlist --max-filesize 64M -o "${outputPath}" "${url}"`;
      
      console.log('Ejecutando comando yt-dlp:', command);
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 120000 // 2 minutos timeout
      });
      
      if (stderr && !stderr.includes('Deleting original file')) {
        console.log('yt-dlp stderr:', stderr);
      }
      
      console.log('yt-dlp stdout:', stdout);

      // Verificar que el archivo existe
      if (fs.existsSync(outputPath)) {
        console.log('Video descargado exitosamente:', outputPath);
        return outputPath;
      } else {
        console.error('El archivo no fue creado');
        return null;
      }
    } catch (error: any) {
      console.error('Error en downloadYouTubeVideo:', error);
      console.error('Error message:', error.message);
      console.error('Error stderr:', error.stderr);
      return null;
    }
  }

  private async getChromiumPath(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('which chromium');
      return stdout.trim();
    } catch (error) {
      console.error('Chromium no encontrado:', error);
      return null;
    }
  }

  private async initializeClient() {
    if (this.isInitialized) return;

    const chromiumPath = await this.getChromiumPath();
    console.log('Chromium path:', chromiumPath || 'No encontrado, usando default');

    const puppeteerConfig: any = {
      headless: true,
      timeout: 60000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--memory-pressure-off',
        '--max_old_space_size=4096'
      ]
    };

    if (chromiumPath) {
      puppeteerConfig.executablePath = chromiumPath;
    }

    console.log('Configuración de Puppeteer:', JSON.stringify(puppeteerConfig, null, 2));

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "whatsapp-ai-assistant"
      }),
      puppeteer: puppeteerConfig
    });

    this.setupEventHandlers();
    this.isInitialized = true;
  }

  private setupEventHandlers() {
    if (!this.client) return;

    this.client.on('loading_screen', (percent: any, message: any) => {
      console.log('Cargando WhatsApp Web...', percent, message);
    });

    this.client.on('qr', async (qr: string) => {
      if (!this.usePairingCode) {
        console.log('✓ QR Code recibido, generando imagen...');
        try {
          this.qrCode = await QRCode.toDataURL(qr);
          console.log('✓ QR Code generado exitosamente, disponible para escanear');
        } catch (error) {
          console.error('✗ Error generando QR Code:', error);
        }
      }
    });

    this.client.on('pairing_code', (code: string) => {
      console.log('✓ Código de emparejamiento recibido:', code);
      this.pairingCode = code;
    });

    this.client.on('ready', () => {
      console.log('✓ WhatsApp Client está listo!');
      this.isReady = true;
      this.isConnecting = false;
    });

    this.client.on('authenticated', () => {
      console.log('✓ WhatsApp autenticado exitosamente');
    });

    this.client.on('auth_failure', (msg: string) => {
      console.error('✗ Fallo en autenticación:', msg);
      this.isConnecting = false;
    });

    this.client.on('disconnected', (reason: string) => {
      console.log('WhatsApp desconectado:', reason);
      this.isReady = false;
      this.isConnecting = false;
      this.qrCode = '';
      this.pairingCode = '';

      // Reset client state for potential reconnection
      this.client = null;
      this.isInitialized = false;
    });

    this.client.on('change_state', (state: any) => {
      console.log('Estado cambió a:', state);
    });

    this.client.on('message_create', async (message: any) => {
      // Solo responder a mensajes recibidos (no enviados por nosotros)
      if (message.fromMe) return;

      try {
        // Obtener información del contacto
        const contact = await message.getContact();
        const chat = await message.getChat();

        // Responder tanto en chats privados como en grupos
        const userName = contact.name || contact.pushname || 'Usuario';
        const chatType = chat.isGroup ? 'grupo' : 'privado';

        // En grupos, solo responder si:
        // 1. El mensaje menciona al bot
        // 2. El mensaje es una respuesta a un mensaje del bot
        if (chat.isGroup) {
          const settings = await storage.getSettings();
          const enableGroupMessages = settings?.enableGroupMessages === 'true';

          // Si los mensajes de grupo están deshabilitados, no responder
          if (!enableGroupMessages) {
            console.log('Mensajes de grupo deshabilitados, ignorando mensaje');
            return;
          }

          let shouldRespond = false;

          try {
            // Verificar si el mensaje menciona al bot
            const mentionedIds = await message.getMentions();
            console.log('Menciones detectadas:', mentionedIds?.length || 0);

            if (mentionedIds && mentionedIds.length > 0 && this.client?.info?.wid) {
              const botId = this.client.info.wid._serialized;
              console.log('Bot ID:', botId);

              const isMentioned = mentionedIds.some((mention: any) => {
                console.log('Comparando con mención:', mention.id._serialized);
                return mention.id._serialized === botId;
              });

              if (isMentioned) {
                console.log('Bot fue mencionado, respondiendo');
                shouldRespond = true;
              }
            }

            // Verificar si el mensaje es una respuesta a un mensaje del bot
            if (!shouldRespond && message.hasQuotedMsg) {
              const quotedMsg = await message.getQuotedMessage();
              console.log('Mensaje citado fromMe:', quotedMsg?.fromMe);

              if (quotedMsg && quotedMsg.fromMe) {
                console.log('Mensaje es respuesta al bot, respondiendo');
                shouldRespond = true;
              }
            }
          } catch (error) {
            console.error('Error verificando menciones/respuestas:', error);
          }

          // Si no es mencionado ni respuesta al bot, ignorar
          if (!shouldRespond) {
            console.log('Bot no fue mencionado ni respondido, ignorando mensaje en grupo');
            return;
          }
        }

        // Usar número de teléfono o ID de chat como identificador único
        const userId = `whatsapp_${contact.number || chat.id._serialized}`;

        console.log(`Mensaje recibido de ${userName} en chat ${chatType}: ${message.body}`);

        // Detectar comando de descarga de YouTube
        const youtubeDownloadRegex = /^\/descarga\s+yt\s+(https?:\/\/[^\s]+)/i;
        const youtubeMatch = message.body.match(youtubeDownloadRegex);
        
        // Detectar comando de descarga de Instagram
        const instagramDownloadRegex = /^\/descarga\s+ig\s+(https?:\/\/[^\s]+)/i;
        const instagramMatch = message.body.match(instagramDownloadRegex);
        
        console.log('DEBUG - Buscando comando de descarga en:', message.body);
        console.log('DEBUG - YouTube Match:', youtubeMatch);
        console.log('DEBUG - Instagram Match:', instagramMatch);

        if (youtubeMatch || instagramMatch) {
          const isYouTube = !!youtubeMatch;
          const videoUrl = isYouTube ? youtubeMatch[1] : instagramMatch[1];
          const platform = isYouTube ? 'YouTube' : 'Instagram';
          
          // Instagram requiere autenticación, informar al usuario
          if (!isYouTube) {
            await message.reply('❌ Lo siento, Instagram requiere autenticación para descargar videos. Por ahora solo funciona con YouTube.\n\n✅ Usa: `/descarga yt [enlace de YouTube]`');
            return;
          }
          
          try {
            await message.reply(`🎥 Descargando video de ${platform}, esto puede tomar unos minutos...`);
            
            const videoPath = await this.downloadYouTubeVideo(videoUrl);
            
            if (videoPath && fs.existsSync(videoPath)) {
              // Verificar el tamaño del archivo
              const stats = fs.statSync(videoPath);
              const fileSizeMB = stats.size / (1024 * 1024);
              
              if (fileSizeMB > 64) {
                await message.reply(`❌ El video es demasiado grande (${fileSizeMB.toFixed(2)}MB). WhatsApp solo permite archivos de hasta 64MB.`);
                // Eliminar el archivo descargado
                fs.unlinkSync(videoPath);
              } else {
                // Crear media desde el archivo
                const media = MessageMedia.fromFilePath(videoPath);
                
                // Enviar el video
                await message.reply(media, undefined, { caption: `✅ Aquí está tu video de ${platform}` });
                console.log(`Video de ${platform} enviado exitosamente: ${videoPath}`);
                
                // Eliminar el archivo después de enviarlo
                setTimeout(() => {
                  if (fs.existsSync(videoPath)) {
                    fs.unlinkSync(videoPath);
                    console.log(`Archivo temporal eliminado: ${videoPath}`);
                  }
                }, 5000);
              }
            } else {
              await message.reply('❌ Error al descargar el video. Verifica que el enlace sea correcto.');
            }
          } catch (error: any) {
            console.error(`Error procesando descarga de ${platform}:`, error);
            await message.reply(`❌ Error al descargar el video: ${error.message || 'Error desconocido'}`);
          }
          
          return; // No continuar con el procesamiento normal de Gemini
        }

        // Obtener historial de conversación
        const conversationHistory = await storage.getMessages(userId);

        // Verificar si el mensaje ya fue guardado para evitar duplicación
        const lastMsg = conversationHistory[conversationHistory.length - 1];
        const messageAlreadySaved = lastMsg && lastMsg.sender === 'user' && lastMsg.content === message.body;

        // Obtener configuración para prompt personalizado
        const settings = await storage.getSettings();

        // Get current date for context
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        // Verificar si el número está en la lista restringida
        const isRestricted = storage.isRestrictedNumber(contact.number || chat.id._serialized);
        
        // Obtener API key y custom prompt de settings
        const apiKey = settings.geminiApiKey || undefined;
        const customPrompt = isRestricted 
          ? (settings.restrictedPrompt || undefined)
          : (settings.customPrompt || undefined);

        // Generar respuesta de IA con historial completo (sin duplicar el mensaje actual)
        const aiResponse = await generateChatResponse(
          message.body, 
          userName,
          customPrompt,
          conversationHistory,
          apiKey
        );

        // Solo guardar el mensaje del usuario si NO está ya en el historial
        if (!messageAlreadySaved) {
          await storage.createMessage({
            content: message.body,
            sender: 'user',
            username: userId
          });
        }

        // Guardar la respuesta de la IA
        await storage.createMessage({
          content: aiResponse,
          sender: 'assistant',
          username: userId
        });

        // Enviar respuesta
        await message.reply(aiResponse);
        console.log(`Respuesta enviada en ${chatType}: ${aiResponse.substring(0, 50)}...`);
      } catch (error: any) {
        console.error('Error procesando mensaje:', error);
        
        // Informar al usuario sobre el error
        try {
          let errorMessage = 'Lo siento, ocurrió un error al procesar tu mensaje.';
          
          if (error?.message?.includes('quota') || error?.message?.includes('429')) {
            errorMessage = 'Lo siento, se ha excedido el límite de la API de Gemini. Por favor, contacta al administrador para configurar una API key propia o espera a que se resetee el límite diario.';
          }
          
          await message.reply(errorMessage);
        } catch (replyError) {
          console.error('Error enviando mensaje de error:', replyError);
        }
      }
    });
  }

  async initialize(usePairingCode: boolean = false, phoneNumber?: string) {
    if (this.isConnecting || this.isReady) {
      console.log('Ya está inicializando o listo');
      return;
    }

    try {
      this.isConnecting = true;
      this.usePairingCode = usePairingCode;

      if (usePairingCode && !phoneNumber) {
        throw new Error('Se requiere número de teléfono para el método de código de emparejamiento');
      }

      console.log(`→ Paso 1: Inicializando cliente de WhatsApp con ${usePairingCode ? 'código de emparejamiento' : 'QR'}...`);

      await this.initializeClient();
      console.log('→ Paso 2: Cliente creado, inicializando conexión...');

      if (!this.client) {
        throw new Error('No se pudo inicializar el cliente de WhatsApp');
      }

      console.log('→ Paso 3: Llamando a client.initialize()...');

      // Set a timeout for initialization
      const initPromise = this.client.initialize();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: WhatsApp initialization took too long')), 120000);
      });

      await Promise.race([initPromise, timeoutPromise]);

      // Si usamos código de emparejamiento, solicitar el código
      if (usePairingCode && phoneNumber) {
        console.log('→ Paso 4: Solicitando código de emparejamiento...');
        await this.client.requestPairingCode(phoneNumber);
      }

      console.log('→ Paso 4: client.initialize() completado, esperando eventos...');
    } catch (error: any) {
      console.error('✗ Error inicializando WhatsApp:', error?.message || error);
      console.error('Stack trace:', error?.stack);
      this.isConnecting = false;

      // Clean up client if initialization failed
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (destroyError) {
          console.error('Error cleaning up client:', destroyError);
        }
        this.client = null;
        this.isInitialized = false;
      }

      throw error;
    }
  }

  async disconnect() {
    if (this.isReady && this.client) {
      await this.client.destroy();
      this.isReady = false;
      this.isConnecting = false;
      this.qrCode = '';
      this.pairingCode = '';
      console.log('Cliente WhatsApp desconectado');
    }
  }

  getQRCode(): string {
    return this.qrCode;
  }

  getPairingCode(): string {
    return this.pairingCode;
  }

  getStatus(): { isReady: boolean; isConnecting: boolean; hasQR: boolean; hasPairingCode: boolean; usePairingCode: boolean } {
    return {
      isReady: this.isReady,
      isConnecting: this.isConnecting,
      hasQR: !!this.qrCode,
      hasPairingCode: !!this.pairingCode,
      usePairingCode: this.usePairingCode
    };
  }

  async sendMessage(to: string, message: string) {
    if (!this.isReady || !this.client) {
      throw new Error('Cliente WhatsApp no está listo');
    }

    try {
      const chatId = to.includes('@') ? to : `${to}@c.us`;
      await this.client.sendMessage(chatId, message);
      console.log(`Mensaje enviado a ${to}: ${message}`);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  setCustomPrompt(prompt: string) {
    this.customPrompt = prompt;
  }

  getCustomPrompt(): string {
    return this.customPrompt;
  }
}

// Instancia singleton
export const whatsappService = new WhatsAppService();