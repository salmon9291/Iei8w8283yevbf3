import { users, messages, type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMessagesByUsername(username: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessagesByUsername(username: string): Promise<void>;
}

const DATA_DIR = join(process.cwd(), 'data');
const MESSAGES_FILE = join(DATA_DIR, 'messages.json');
const USERS_FILE = join(DATA_DIR, 'users.json');

// Crear directorio de datos si no existe
if (!existsSync(DATA_DIR)) {
  require('fs').mkdirSync(DATA_DIR, { recursive: true });
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.loadData();
  }

  private loadData() {
    try {
      if (existsSync(MESSAGES_FILE)) {
        const messagesData = readFileSync(MESSAGES_FILE, 'utf-8');
        this.messages = new Map(JSON.parse(messagesData));
      }
      if (existsSync(USERS_FILE)) {
        const usersData = readFileSync(USERS_FILE, 'utf-8');
        this.users = new Map(JSON.parse(usersData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.messages = new Map();
      this.users = new Map();
    }
  }

  private saveData() {
    try {
      writeFileSync(MESSAGES_FILE, JSON.stringify(Array.from(this.messages.entries()), null, 2));
      writeFileSync(USERS_FILE, JSON.stringify(Array.from(this.users.entries()), null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    this.saveData();
    return user;
  }

  async getMessagesByUsername(username: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter((message) => message.username === username)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date().toISOString(),
    };
    this.messages.set(id, message);
    this.saveData();
    return message;
  }

  async clearMessagesByUsername(username: string): Promise<void> {
    const messagesToDelete = Array.from(this.messages.entries())
      .filter(([_, message]) => message.username === username)
      .map(([id, _]) => id);

    messagesToDelete.forEach(id => this.messages.delete(id));
    this.saveData();
  }
}

export const storage = new MemStorage();