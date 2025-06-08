import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { VoiceControls } from "./voice-controls";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  username: string;
  onClearUsername: () => void;
}

export function ChatInterface({ username, onClearUsername }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [lastAiMessage, setLastAiMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    messages,
    isLoading,
    isTyping,
    sendMessage,
    isSending,
    clearMessages,
    isClearing,
    error,
  } = useChat(username);

  // Track last AI message for voice controls
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'ai') {
        setLastAiMessage(lastMessage.content);
      }
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isSending) return;

    sendMessage({ content: trimmedMessage });
    setMessageText("");
  };

  const handleClearChat = () => {
    if (window.confirm("¿Estás seguro de que quieres limpiar el historial del chat?")) {
      clearMessages();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setMessageText(transcript);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">{username}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoicePanel(!showVoicePanel)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                title="Controles de voz"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm5.3 4.7c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4C17.2 9.4 18 10.6 18 12s-.8 2.6-2.1 3.9c-.4.4-.4 1 0 1.4.2.2.5.3.7.3s.5-.1.7-.3C19.1 15.5 20 13.8 20 12s-.9-3.5-2.7-5.3zM4 9v6h4l5 5V4L8 9H4z"/>
                </svg>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                disabled={isClearing}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                title="Limpiar chat"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                />
              ))}

              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-100 px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50"
                maxLength={1000}
                disabled={isSending}
              />
            </div>

            <Button
              type="submit"
              disabled={!messageText.trim() || isSending}
              className="bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Voice Panel */}
      {showVoicePanel && (
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <VoiceControls
            onTranscriptReceived={handleVoiceTranscript}
            isProcessing={isSending}
            lastAiMessage={lastAiMessage}
          />
        </div>
      )}
    </div>
  );
}