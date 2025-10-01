
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
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    };

    if (chromiumPath) {
      puppeteerConfig.executablePath = chromiumPath;
    }

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
    
    this.client.on('qr', async (qr) => {
      console.log('QR Code recibido');
      try {
        this.qrCode = await QRCode.toDataURL(qr);
        console.log('QR Code generado exitosamente');
      } catch (error) {
        console.error('Error generando QR Code:', error);
      }
    });

    this.client.on('ready', () => {
      console.log('WhatsApp Client está listo!');
      this.isReady = true;
      this.isConnecting = false;
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp autenticado exitosamente');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('Fallo en autenticación:', msg);
      this.isConnecting = false;
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp desconectado:', reason);
      this.isReady = false;
      this.isConnecting = false;
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
      return;
    }

    try {
      this.isConnecting = true;
      console.log('Inicializando cliente de WhatsApp...');
      
      await this.initializeClient();
      
      if (!this.client) {
        throw new Error('No se pudo inicializar el cliente de WhatsApp');
      }
      
      await this.client.initialize();
    } catch (error) {
      console.error('Error inicializando WhatsApp:', error);
      this.isConnecting = false;
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
