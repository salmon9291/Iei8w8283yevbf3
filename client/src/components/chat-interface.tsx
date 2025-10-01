import { useState, useRef, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { SimpleFace } from "./simple-face";
import { generateVoiceAudio, playVoiceAudio } from "@/lib/getvoices";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppPanel } from "./whatsapp-panel";

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

  // Función para texto a voz con GetVoices.ai y movimiento dinámico de VTuber
  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);

      // Función para simular movimiento dinámico de VTuber más realista
      const simulateVTuberMovement = (text: string, duration: number) => {
        const words = text.split(' ');
        const wordDuration = duration / words.length;
        let wordIndex = 0;

        const wordInterval = setInterval(() => {
          if (wordIndex < words.length) {
            const word = words[wordIndex];
            // Variar la intensidad según el tipo de palabra
            let intensity = 0.3;

            // Palabras emocionales más intensas
            if (/^(wow|oh|ah|hey|hola|genial|increíble|perfecto|excelente)$/i.test(word)) {
              intensity = 0.15;
            }
            // Palabras interrogativas
            else if (word.includes('?') || /^(qué|cómo|cuándo|dónde|por qué)$/i.test(word)) {
              intensity = 0.2;
            }
            // Palabras exclamativas
            else if (word.includes('!')) {
              intensity = 0.18;
            }
            // Palabras largas más expresivas
            else if (word.length > 7) {
              intensity = 0.4;
            }

            // Actualizar velocidad de animación de manera más dinámica
            const mouthElement = document.querySelector('.mouth-talking') as HTMLElement;
            if (mouthElement) {
              mouthElement.style.animationDuration = `${intensity}s`;
              // Añadir variación en la intensidad
              if (Math.random() > 0.7) {
                mouthElement.style.transform = `scale(${1 + Math.random() * 0.3})`;
                setTimeout(() => {
                  mouthElement.style.transform = 'scale(1)';
                }, intensity * 500);
              }
            }

            wordIndex++;
          } else {
            clearInterval(wordInterval);
          }
        }, wordDuration); // Velocidad ajustada al audio real

        return wordInterval;
      };

      // Generar y reproducir audio con GetVoices.ai - voz masculina
      const audioUrl = await generateVoiceAudio(text, "adam");

      // Estimar duración basada en el texto (aproximación)
      const estimatedDuration = text.length * 80; // ~80ms por carácter

      // Iniciar animación VTuber
      const movementInterval = simulateVTuberMovement(text, estimatedDuration);

      // Reproducir audio
      await playVoiceAudio(audioUrl);

      // Limpiar
      clearInterval(movementInterval);
      setIsSpeaking(false);

    } catch (error) {
      console.error("Error con GetVoices.ai, usando voz nativa como respaldo:", error);
      setIsSpeaking(false);

      // Fallback a voz nativa
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 0.9;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Auto scroll y reproducir voz cuando lleguen nuevos mensajes del asistente
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'assistant' && !isSpeaking) {
      setTimeout(async () => {
        await speakText(lastMessage.content);
      }, 500);
    }
  }, [messages]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isSending) return;

    // Detener cualquier audio en reproducción
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Pausar todos los elementos de audio
    document.querySelectorAll('audio').forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
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
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="flex items-center justify-center">
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
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}