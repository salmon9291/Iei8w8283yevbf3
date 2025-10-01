import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./services/gemini";
import { whatsappService } from "./services/whatsapp";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";

const chatRequestSchema = z.object({
  content: z.string().min(1),
  username: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get messages for a user
  app.get("/api/messages/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const messages = await storage.getMessages(username);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message and get AI response
  app.post("/api/messages", async (req, res) => {
    try {
      const { content, username } = chatRequestSchema.parse(req.body);

      // Save user message
      const userMessage = await storage.createMessage({
        content,
        sender: "user",
        username,
      });

      // Generate AI response
      const aiResponse = await generateChatResponse(content, username);

      // Save AI message
      const aiMessage = await storage.createMessage({
        content: aiResponse,
        sender: "assistant",
        username,
      });

      res.json({
        userMessage,
        aiMessage,
      });
    } catch (error) {
      console.error("Error processing message:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data" });
      } else {
        res.status(500).json({ error: "Failed to process message" });
      }
    }
  });

  // WhatsApp endpoints
  app.post("/api/whatsapp/initialize", async (req, res) => {
    try {
      const { usePairingCode, phoneNumber } = req.body;
      await whatsappService.initialize(usePairingCode, phoneNumber);
      res.json({ message: "WhatsApp inicializando..." });
    } catch (error) {
      console.error("Error inicializando WhatsApp:", error);
      res.status(500).json({ error: "Error inicializando WhatsApp" });
    }
  });

  app.get("/api/whatsapp/qr", async (req, res) => {
    try {
      const qrCode = whatsappService.getQRCode();
      if (!qrCode) {
        res.status(404).json({ error: "QR Code no disponible" });
        return;
      }
      res.json({ qrCode });
    } catch (error) {
      console.error("Error obteniendo QR:", error);
      res.status(500).json({ error: "Error obteniendo QR Code" });
    }
  });

  app.get("/api/whatsapp/pairing-code", async (req, res) => {
    try {
      const pairingCode = whatsappService.getPairingCode();
      if (!pairingCode) {
        res.status(404).json({ error: "Código de emparejamiento no disponible" });
        return;
      }
      res.json({ pairingCode });
    } catch (error) {
      console.error("Error obteniendo código de emparejamiento:", error);
      res.status(500).json({ error: "Error obteniendo código de emparejamiento" });
    }
  });

  app.get("/api/whatsapp/status", async (req, res) => {
    try {
      const status = whatsappService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error obteniendo estado:", error);
      res.status(500).json({ error: "Error obteniendo estado" });
    }
  });

  app.post("/api/whatsapp/disconnect", async (req, res) => {
    try {
      await whatsappService.disconnect();
      res.json({ message: "WhatsApp desconectado" });
    } catch (error) {
      console.error("Error desconectando WhatsApp:", error);
      res.status(500).json({ error: "Error desconectando WhatsApp" });
    }
  });

  const sendMessageSchema = z.object({
    to: z.string().min(1),
    message: z.string().min(1),
  });

  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { to, message } = sendMessageSchema.parse(req.body);
      await whatsappService.sendMessage(to, message);
      res.json({ message: "Mensaje enviado exitosamente" });
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      res.status(500).json({ error: "Error enviando mensaje" });
    }
  });

  // Clear messages for a user
  app.delete("/api/messages/:username", async (req, res) => {
    try {
      const { username } = req.params;
      await storage.clearMessages(username);
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing messages:", error);
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
