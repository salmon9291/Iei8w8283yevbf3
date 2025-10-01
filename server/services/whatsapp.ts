
import whatsappWeb from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { generateChatResponse } from './gemini';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const { Client, LocalAuth, MessageMedia } = whatsappWeb;

class WhatsAppService {
  private client: Client | null = null;
  private qrCode: string = '';
  private isReady: boolean = false;
  private isConnecting: boolean = false;
  private isInitialized: boolean = false;

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

    this.client.on('qr', async (qr) => {
      console.log('✓ QR Code recibido, generando imagen...');
      try {
        this.qrCode = await QRCode.toDataURL(qr);
        console.log('✓ QR Code generado exitosamente, disponible para escanear');
      } catch (error) {
        console.error('✗ Error generando QR Code:', error);
      }
    });

    this.client.on('ready', () => {
      console.log('✓ WhatsApp Client está listo!');
      this.isReady = true;
      this.isConnecting = false;
    });

    this.client.on('authenticated', () => {
      console.log('✓ WhatsApp autenticado exitosamente');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('✗ Fallo en autenticación:', msg);
      this.isConnecting = false;
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp desconectado:', reason);
      this.isReady = false;
      this.isConnecting = false;
      this.qrCode = '';
      
      // Reset client state for potential reconnection
      if (reason !== 'NAVIGATION') {
        this.client = null;
        this.isInitialized = false;
      }
    });

    this.client.on('change_state', (state: any) => {
      console.log('Estado cambió a:', state);
    });

    this.client.on('message_create', async (message) => {
      // Solo responder a mensajes recibidos (no enviados por nosotros)
      if (message.fromMe) return;

      try {
        // Obtener información del contacto
        const contact = await message.getContact();
        const chat = await message.getChat();

        // Solo responder en chats privados (no grupos)
        if (!chat.isGroup) {
          console.log(`Mensaje recibido de ${contact.name || contact.pushname}: ${message.body}`);

          // Generar respuesta de IA
          const aiResponse = await generateChatResponse(
            message.body, 
            contact.name || contact.pushname || 'Usuario'
          );

          // Enviar respuesta
          await message.reply(aiResponse);
          console.log(`Respuesta enviada: ${aiResponse.substring(0, 50)}...`);
        }
      } catch (error) {
        console.error('Error procesando mensaje:', error);
      }
    });
  }

  async initialize() {
    if (this.isConnecting || this.isReady) {
      console.log('Ya está inicializando o listo');
      return;
    }

    try {
      this.isConnecting = true;
      console.log('→ Paso 1: Inicializando cliente de WhatsApp...');
      
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
      console.log('Cliente WhatsApp desconectado');
    }
  }

  getQRCode(): string {
    return this.qrCode;
  }

  getStatus(): { isReady: boolean; isConnecting: boolean; hasQR: boolean } {
    return {
      isReady: this.isReady,
      isConnecting: this.isConnecting,
      hasQR: !!this.qrCode
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
}

// Instancia singleton
export const whatsappService = new WhatsAppService();
