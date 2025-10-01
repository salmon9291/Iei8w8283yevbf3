
import whatsappWeb from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { generateChatResponse } from './gemini';
import { exec } from 'child_process';
import { promisify } from 'util';
import { storage } from '../storage';

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
        
        // Usar número de teléfono o ID de chat como identificador único
        const userId = `whatsapp_${contact.number || chat.id._serialized}`;
        
        console.log(`Mensaje recibido de ${userName} en chat ${chatType}: ${message.body}`);

        // Obtener historial de conversación
        const conversationHistory = await storage.getMessages(userId);
        
        // Verificar si el mensaje ya fue guardado para evitar duplicación
        const lastMsg = conversationHistory[conversationHistory.length - 1];
        const messageAlreadySaved = lastMsg && lastMsg.sender === 'user' && lastMsg.content === message.body;
        
        // Obtener configuración para prompt personalizado
        const settings = await storage.getSettings();
        const customPrompt = settings.customPrompt || this.customPrompt;

        // Generar respuesta de IA con historial completo (sin duplicar el mensaje actual)
        const aiResponse = await generateChatResponse(
          message.body, 
          userName,
          customPrompt,
          conversationHistory
        );

        // Solo guardar el mensaje del usuario si NO está ya en el historial
        if (!messageAlreadySaved) {
          await storage.createMessage({
            content: message.body,
            sender: 'user',
            username: userId
          });
        }

        await storage.createMessage({
          content: aiResponse,
          sender: 'assistant',
          username: userId
        });

        // Enviar respuesta
        await message.reply(aiResponse);
        console.log(`Respuesta enviada en ${chatType}: ${aiResponse.substring(0, 50)}...`);
      } catch (error) {
        console.error('Error procesando mensaje:', error);
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
