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

  // Función para texto a voz con movimiento dinámico
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

    // Función para simular movimiento dinámico de VTuber
    const simulateWordMovement = (text: string) => {
      const words = text.split(' ');
      let wordIndex = 0;
      
      const wordInterval = setInterval(() => {
        if (wordIndex < words.length) {
          const word = words[wordIndex];
          // Variar la velocidad según el tipo de palabra
          const baseSpeed = 0.3;
          let speed = baseSpeed;
          
          // Palabras exclamativas más rápidas
          if (word.includes('!') || word.includes('?')) {
            speed = 0.15;
          }
          // Palabras largas más lentas
          else if (word.length > 6) {
            speed = 0.5;
          }
          // Palabras de emoción más dinámicas
          else if (/^(wow|oh|ah|hey|hola|genial|increíble)$/i.test(word)) {
            speed = 0.2;
          }
          
          // Actualizar velocidad de animación
          const mouthElement = document.querySelector('.mouth-talking') as HTMLElement;
          if (mouthElement) {
            mouthElement.style.animationDuration = `${speed}s`;
          }
          
          wordIndex++;
        } else {
          clearInterval(wordInterval);
        }
      }, 400); // Velocidad de palabras
      
      return wordInterval;
    };

    let wordMovementInterval: NodeJS.Timeout;

    utterance.onstart = () => {
      setIsSpeaking(true);
      wordMovementInterval = simulateWordMovement(text);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (wordMovementInterval) clearInterval(wordMovementInterval);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (wordMovementInterval) clearInterval(wordMovementInterval);
    };

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
        {/* Mostrar solo el último mensaje del usuario */}
        {messages.length > 0 && (
          <div className="mb-4">
            {(() => {
              const lastUserMessage = messages.filter(m => m.sender === 'user').slice(-1)[0];
              return lastUserMessage ? (
                <div className="text-sm text-center">
                  <span className="text-gray-500 text-xs">
                    "{lastUserMessage.content}"
                  </span>
                </div>
              ) : null;
            })()}
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