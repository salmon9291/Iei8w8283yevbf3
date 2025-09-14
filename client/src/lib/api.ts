import { apiRequest } from "./queryClient";
import type { Message } from "@shared/schema";

export interface SendMessageResponse {
  userMessage: Message;
  aiMessage: Message;
}

export async function sendMessage(content: string, username: string): Promise<SendMessageResponse> {
  const response = await apiRequest("POST", "/api/messages", {
    content,
    username,
  });
  
  return response.json();
}

export async function getMessages(username: string): Promise<Message[]> {
  const response = await apiRequest("GET", `/api/messages/${username}`);
  return response.json();
}
