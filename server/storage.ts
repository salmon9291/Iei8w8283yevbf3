import { type User, type InsertUser, type Message, type InsertMessage, type Settings, type InsertSettings } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMessages(username: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(username: string): Promise<void>;
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<number, Message>;
  private settings: Settings;
  private messageCounter: number = 1;
  private usersFilePath: string;
  private messagesFilePath: string;
  private settingsFilePath: string;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.settings = {
      id: 'default',
      enableGroupMessages: 'false',
      customPrompt: null,
    };
    this.usersFilePath = path.join(process.cwd(), "data", "users.json");
    this.messagesFilePath = path.join(process.cwd(), "data", "messages.json");
    this.settingsFilePath = path.join(process.cwd(), "data", "settings.json");
    
    // Ensure data directory exists
    const dataDir = path.dirname(this.usersFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(this.usersFilePath)) {
        const usersData = JSON.parse(fs.readFileSync(this.usersFilePath, "utf-8"));
        this.users = new Map(usersData);
      }
      
      if (fs.existsSync(this.messagesFilePath)) {
        const messagesData = JSON.parse(fs.readFileSync(this.messagesFilePath, "utf-8"));
        this.messages = new Map(messagesData);
        this.messageCounter = Math.max(...Array.from(this.messages.keys()), 0) + 1;
      }
      
      if (fs.existsSync(this.settingsFilePath)) {
        const settingsData = JSON.parse(fs.readFileSync(this.settingsFilePath, "utf-8"));
        this.settings = settingsData;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  private saveUsers() {
    try {
      fs.writeFileSync(this.usersFilePath, JSON.stringify(Array.from(this.users.entries())));
    } catch (error) {
      console.error("Error saving users:", error);
    }
  }

  private saveMessages() {
    try {
      fs.writeFileSync(this.messagesFilePath, JSON.stringify(Array.from(this.messages.entries())));
    } catch (error) {
      console.error("Error saving messages:", error);
    }
  }

  private saveSettings() {
    try {
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(this.settings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    this.saveUsers();
    return user;
  }

  async getMessages(username: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.username === username)
      .sort((a, b) => a.id - b.id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageCounter++;
    const message: Message = { 
      ...insertMessage, 
      id,
      timestamp: new Date()
    };
    this.messages.set(id, message);
    this.saveMessages();
    return message;
  }

  async clearMessages(username: string): Promise<void> {
    const messagesToDelete = Array.from(this.messages.entries())
      .filter(([, message]) => message.username === username)
      .map(([id]) => id);
    
    messagesToDelete.forEach(id => this.messages.delete(id));
    this.saveMessages();
  }

  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(newSettings: Partial<InsertSettings>): Promise<Settings> {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
    this.saveSettings();
    return this.settings;
  }
}

export const storage = new MemStorage();
