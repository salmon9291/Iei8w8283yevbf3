import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCmlpC0g1UrSunQeoGUklSRf2o1LD5xlGo";

// Función para extraer contenido de URLs
async function extractContentFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return `No se pudo acceder al enlace: ${url}`;
    }
    
    const html = await response.text();
    
    // Extraer texto del HTML de manera simple
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remover scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remover estilos
      .replace(/<[^>]+>/g, ' ') // Remover todas las etiquetas HTML
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
    
    // Limitar el contenido a 2000 caracteres para no sobrecargar la IA
    return textContent.length > 2000 
      ? textContent.substring(0, 2000) + '...' 
      : textContent;
      
  } catch (error) {
    return `Error al leer el enlace: ${url}`;
  }
}

// Función para detectar URLs en el texto
function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
      }

      if (username.trim().length < 3) {
        return res.status(400).json({ message: "El usuario debe tener al menos 3 caracteres" });
      }

      if (password.length < 4) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 4 caracteres" });
      }

      // Verificar si el usuario ya existe
      const existingUser = await storage.getUserByUsername(username.trim());
      if (existingUser) {
        return res.status(400).json({ message: "El usuario ya existe" });
      }

      // Crear nuevo usuario
      const user = await storage.createUser({ username: username.trim(), password });
      res.json({ message: "Usuario creado exitosamente", user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error interno del servidor. Inténtalo más tarde." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
      }

      // Verificar credenciales
      const user = await storage.getUserByUsername(username.trim());
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
      }

      res.json({ message: "Inicio de sesión exitoso", user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Error interno del servidor. Inténtalo más tarde." });
    }
  });

  // Get messages for a user
  app.get("/api/messages/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const messages = await storage.getMessagesByUsername(username);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message and get AI response
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);

      // Save user message
      const userMessage = await storage.createMessage(validatedData);

      // Get AI response from Gemini
      let aiResponse = "";
      try {
        const customPrompt = req.body.customPrompt || "Eres un asistente de IA que SIEMPRE responde en español. Sin importar el idioma en que te escriban, siempre debes responder en español de manera natural y fluida.";

        // Detectar y procesar URLs en el mensaje
        const urls = extractUrls(validatedData.content);
        let enhancedContent = validatedData.content;
        
        if (urls.length > 0) {
          console.log(`Procesando ${urls.length} enlace(s) encontrado(s)`);
          
          for (const url of urls) {
            const urlContent = await extractContentFromUrl(url);
            enhancedContent += `\n\nContenido del enlace ${url}:\n${urlContent}`;
          }
        }

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${customPrompt} ${urls.length > 0 ? 'El usuario ha compartido uno o más enlaces. Analiza el contenido proporcionado y responde de manera útil.' : ''} Responde a la siguiente pregunta o comentario: ${enhancedContent}`
                }]
              }]
            })
          }
        );

        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }

        const geminiData = await geminiResponse.json();
        aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude generar una respuesta.";
      } catch (error) {
        console.error("Gemini API error:", error);
        aiResponse = "Lo siento, tengo problemas para conectarme a mi servicio de IA en este momento. Por favor, inténtalo de nuevo más tarde.";
      }

      // Save AI response
      const aiMessage = await storage.createMessage({
        content: aiResponse,
        sender: "ai",
        username: validatedData.username,
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid message data", errors: error.errors });
      } else {
        console.error("Error creating message:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    }
  });

  // Clear chat history
  app.delete("/api/messages/:username", async (req, res) => {
    try {
      const { username } = req.params;
      await storage.clearMessagesByUsername(username);
      res.json({ message: "Chat history cleared" });
    } catch (error) {
      console.error("Error clearing messages:", error);
      res.status(500).json({ message: "Failed to clear chat history" });
    }
  });

  // Battle message endpoint
  app.post("/api/battle-message", async (req, res) => {
    try {
      const { prompt, aiId, username } = req.body;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        }
      );

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "No pude generar una respuesta.";

      res.json({ response });
    } catch (error) {
      console.error("Battle message error:", error);
      res.status(500).json({ message: "Error en la batalla de IAs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}