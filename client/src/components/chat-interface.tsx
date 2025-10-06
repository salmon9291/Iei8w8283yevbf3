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

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);

      const simulateVTuberMovement = (text: string, duration: number) => {
        const words = text.split(' ');
        const wordDuration = duration / words.length;
        let wordIndex = 0;

        const wordInterval = setInterval(() => {
          if (wordIndex < words.length) {
            const word = words[wordIndex];
            let intensity = 0.3;

            if (/^(wow|oh|ah|hey|hola|genial|increíble|perfecto|excelente)$/i.test(word)) {
              intensity = 0.15;
            }
            else if (word.includes('?') || /^(qué|cómo|cuándo|dónde|por qué)$/i.test(word)) {
              intensity = 0.2;
            }
            else if (word.includes('!')) {
              intensity = 0.18;
            }
            else if (word.length > 7) {
              intensity = 0.4;
            }

            const mouthElement = document.querySelector('.mouth-talking') as HTMLElement;
            if (mouthElement) {
              mouthElement.style.animationDuration = `${intensity}s`;
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
        }, wordDuration);

        return wordInterval;
      };

      const audioUrl = await generateVoiceAudio(text, "adam");
      const estimatedDuration = text.length * 80;
      const movementInterval = simulateVTuberMovement(text, estimatedDuration);

      await playVoiceAudio(audioUrl);

      clearInterval(movementInterval);
      setIsSpeaking(false);

    } catch (error) {
      console.error("Error con GetVoices.ai, usando voz nativa como respaldo:", error);
      setIsSpeaking(false);

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

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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
      {/* Header con marca de Replit */}
      <div className="text-center mb-6 pb-4 border-b border-[#2E3A52]">
        <h1 className="text-3xl font-bold mb-2">
          <span className="replit-brand">Replit AI Assistant</span>
        </h1>
        <p className="text-sm text-[#9BA4B5]">
          Powered by <span className="text-[#F26430] font-semibold">Replit Agent</span> & <span className="text-[#569CD6] font-semibold">Assistant</span>
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-1 mb-6 bg-[#1C2333] border border-[#2E3A52]">
          <TabsTrigger 
            value="chat" 
            className="data-[state=active]:bg-[#F26430] data-[state=active]:text-white"
          >
            <i className="fas fa-comments mr-2"></i>
            Chat IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="replit-pulse">
              <SimpleFace isSpeaking={isSpeaking} />
            </div>
          </div>

          <div className="bg-[#1C2333] border border-[#2E3A52] rounded-lg p-6">
            {messages.length > 0 && (
              <div className="mb-4">
                {(() => {
                  const lastUserMessage = messages.filter(m => m.sender === 'user').slice(-1)[0];
                  return lastUserMessage ? (
                    <div className="text-sm text-center bg-[#2E3A52] rounded-lg p-3">
                      <span className="text-[#9BA4B5] text-xs block mb-1">Tu mensaje:</span>
                      <span className="text-white">"{lastUserMessage.content}"</span>
                    </div>
                  ) : null;
                })()}
                <div ref={messagesEndRef} />
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <Input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje aquí..."
                className="flex-1 bg-[#0E1525] border-[#2E3A52] text-white placeholder-[#9BA4B5] focus:border-[#F26430] focus:ring-[#F26430]"
                disabled={isSending}
                data-testid="input-message"
              />

              <Button
                type="submit"
                disabled={!messageText.trim() || isSending}
                className="bg-[#F26430] text-white hover:bg-[#569CD6] transition-colors duration-300 px-6 font-semibold"
                data-testid="button-send"
              >
                {isSending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Enviar
                  </>
                )}
              </Button>
            </form>

            {error && (
              <div className="mt-3 text-[#E06C75] text-sm bg-[#2E3A52] rounded p-3 border border-[#E06C75]">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Error: {error}
              </div>
            )}
          </div>

          {/* Footer con créditos */}
          <div className="text-center text-xs text-[#9BA4B5] pt-4 border-t border-[#2E3A52]">
            <p>
              Creado con <i className="fas fa-heart text-[#F26430]"></i> usando{" "}
              <span className="text-[#F26430] font-semibold">Replit Agent</span> y{" "}
              <span className="text-[#569CD6] font-semibold">Replit Assistant</span>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}