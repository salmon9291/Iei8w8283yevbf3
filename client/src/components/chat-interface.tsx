import { useState, useRef, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { SimpleFace } from "./simple-face";

interface ChatInterfaceProps {
  username: string;
}

export function ChatInterface({ username }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    isSending,
    error,
  } = useChat(username);

  // Función para texto a voz
  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      console.log("Tu navegador no soporta texto a voz");
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Auto scroll y reproducir voz cuando lleguen nuevos mensajes del asistente
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'assistant' && !isSpeaking) {
      setTimeout(() => {
        speakText(lastMessage.content);
      }, 500);
    }
  }, [messages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isSending) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    sendMessage({ content: trimmedMessage });
    setMessageText("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Cara simple en el centro superior */}
      <div className="flex-1 flex items-center justify-center">
        <SimpleFace isSpeaking={isSpeaking} />
      </div>

      {/* Área de chat en la parte inferior */}
      <div className="p-6 border-t border-gray-800">
        {/* Mensajes */}
        {messages.length > 0 && (
          <div className="mb-4 max-h-40 overflow-y-auto space-y-2">
            {messages.slice(-3).map((message) => (
              <div key={message.id} className="text-sm">
                <span className="text-gray-400">
                  {message.sender === 'user' ? username : 'Asistente'}:
                </span>
                <span className="ml-2 text-white">
                  {message.content}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input de texto */}
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <Input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-white"
            disabled={isSending}
            data-testid="input-message"
          />
          
          <Button
            type="submit"
            disabled={!messageText.trim() || isSending}
            className="bg-white text-black hover:bg-gray-200 px-6"
            data-testid="button-send"
          >
            {isSending ? 'Enviando...' : 'Enviar'}
          </Button>
        </form>

        {error && (
          <div className="mt-3 text-red-400 text-sm">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}