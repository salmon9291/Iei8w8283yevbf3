import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./services/gemini";
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
