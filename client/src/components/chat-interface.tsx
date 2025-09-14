import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

interface ChatInterfaceProps {
  username: string;
}

// Componente de Avatar animado
function Avatar({ isSpeaking, isTyping, username }: { isSpeaking: boolean; isTyping: boolean; username: string }) {
  return (
    <div className="flex flex-col items-center space-y-4 mb-8">
      <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center shadow-lg transition-all duration-300 ${
        isSpeaking ? 'scale-110 shadow-xl' : isTyping ? 'scale-105' : 'scale-100'
      }`}>
        {/* Cara del avatar */}
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-300 to-purple-500 flex items-center justify-center">
          {/* Ojos */}
          <div className="absolute top-8 left-8 w-3 h-3 bg-white rounded-full"></div>
          <div className="absolute top-8 right-8 w-3 h-3 bg-white rounded-full"></div>
          {/* Boca */}
          <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-200 ${
            isSpeaking ? 'w-8 h-4 bg-white rounded-full' : isTyping ? 'w-6 h-2 bg-white rounded-full' : 'w-4 h-1 bg-white rounded-full'
          }`}></div>
          
          {/* Ondas de sonido cuando habla */}
          {isSpeaking && (
            <>
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-300 rounded-full animate-ping"></div>
              <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-blue-200 rounded-full animate-ping" style={{ animationDelay: '0.1s' }}></div>
              <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-300 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
              <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-blue-200 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
            </>
          )}
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Asistente IA</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSpeaking ? '🔊 Hablando...' : isTyping ? '💭 Pensando...' : `¡Hola ${username}!`}
        </p>
      </div>
    </div>
  );
}

export function ChatInterface({ username }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const aiPrompt = `Eres un asistente de IA que SIEMPRE responde en español. Tu nombre es Asistente y te diriges al usuario como "${username}". Siempre menciona su nombre al menos una vez en cada respuesta de manera natural y amigable. Sin importar el idioma en que te escriban, siempre debes responder en español de manera natural y fluida.`;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    isSending,
    error,
  } = useChat(username, aiPrompt);

  // Función para texto a voz
  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      console.log("Tu navegador no soporta texto a voz");
      return;
    }

    // Cancelar cualquier síntesis en curso
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
    scrollToBottom();
    
    // Si el último mensaje es del asistente, reproducirlo
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'assistant' && !isTyping && !isSpeaking) {
      // Pequeño delay para que se complete la animación
      setTimeout(() => {
        speakText(lastMessage.content);
      }, 500);
    }
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isSending) return;

    // Detener cualquier síntesis de voz en curso
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    sendMessage({ content: trimmedMessage });
    setMessageText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const lastAssistantMessage = messages.slice().reverse().find(m => m.sender === 'assistant');
      if (lastAssistantMessage) {
        speakText(lastAssistantMessage.content);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Avatar en la parte superior */}
      <div className="flex-shrink-0 pt-8 px-6">
        <Avatar isSpeaking={isSpeaking} isTyping={isTyping} username={username} />
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Escribe un mensaje para comenzar a conversar conmigo
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Área de entrada de texto */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje aquí..."
                  className="min-h-[60px] max-h-32 resize-none text-base border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl"
                  disabled={isSending}
                  data-testid="input-message"
                />
              </div>
              <div className="flex items-center space-x-2">
                {/* Botón de control de voz */}
                <Button
                  type="button"
                  onClick={toggleVoice}
                  variant="outline"
                  className="h-[60px] px-4 rounded-xl border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  data-testid="button-toggle-voice"
                >
                  {isSpeaking ? (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </Button>
                
                {/* Botón de enviar */}
                <Button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-[60px] px-6 rounded-xl transition-all duration-200 flex items-center space-x-2"
                  data-testid="button-send"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  )}
                  <span>Enviar</span>
                </Button>
              </div>
            </div>
          </form>
          
          {error && (
            <div className="mt-3 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}