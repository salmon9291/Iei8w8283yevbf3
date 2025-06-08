
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { VoiceControls } from "./voice-controls";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  username: string;
  onClearUsername: () => void;
}

type TabType = 'chat' | 'voice' | 'ai-battle' | 'settings';

export function ChatInterface({ username, onClearUsername }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [lastAiMessage, setLastAiMessage] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState("Eres un asistente de IA que SIEMPRE responde en español. Sin importar el idioma en que te escriban, siempre debes responder en español de manera natural y fluida.");
  const [tempPrompt, setTempPrompt] = useState(aiPrompt);
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
  } = useChat(username, aiPrompt);

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

  const handleSavePrompt = () => {
    setAiPrompt(tempPrompt);
    toast({
      title: "Configuración guardada",
      description: "El prompt de la IA ha sido actualizado",
    });
  };

  const tabs = [
    { id: 'chat' as TabType, label: 'Chat', icon: '💬' },
    { id: 'voice' as TabType, label: 'Voz', icon: '🎤' },
    { id: 'ai-battle' as TabType, label: 'Batalla IA', icon: '⚔️' },
    { id: 'settings' as TabType, label: 'Configuración', icon: '⚙️' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex-1 flex flex-col">
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
        );

      case 'voice':
        return (
          <div className="flex-1 p-6">
            <VoiceControls
              onTranscriptReceived={handleVoiceTranscript}
              isProcessing={isSending}
              lastAiMessage={lastAiMessage}
            />
          </div>
        );

      case 'ai-battle':
        return <AIBattleTab username={username} />;

      case 'settings':
        return (
          <div className="flex-1 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Configuración del Prompt de IA</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt personalizado:
                  </label>
                  <Textarea
                    value={tempPrompt}
                    onChange={(e) => setTempPrompt(e.target.value)}
                    placeholder="Escribe aquí cómo quieres que se comporte la IA..."
                    className="w-full h-32 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  />
                </div>
                <Button
                  onClick={handleSavePrompt}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg"
                >
                  Guardar Configuración
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Información de Usuario</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600"><strong>Usuario:</strong> {username}</p>
                <Button
                  onClick={onClearUsername}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Cambiar Usuario
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        {/* Header with Tabs */}
        <div className="bg-white border-b border-gray-100">
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{username}</span>
              </div>

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

          {/* Tabs */}
          <div className="flex space-x-1 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-50 text-gray-900 border-b-2 border-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}

// Componente para la batalla de IAs
function AIBattleTab({ username }: { username: string }) {
  const [topic, setTopic] = useState("");
  const [battleMessages, setBattleMessages] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [roundCount, setRoundCount] = useState(0);
  const maxRounds = 6;

  const startBattle = async () => {
    if (!topic.trim()) return;
    
    setIsRunning(true);
    setRoundCount(0);
    setBattleMessages([]);

    let currentTopic = topic;
    
    for (let round = 0; round < maxRounds; round++) {
      setRoundCount(round + 1);
      
      // IA 1 (Optimista)
      const ai1Response = await sendBattleMessage(
        `Eres una IA optimista y entusiasta. Responde sobre: ${currentTopic}`,
        `ai1`,
        username
      );
      
      setBattleMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        content: ai1Response,
        sender: 'ai1',
        aiName: 'IA Optimista',
        round: round + 1
      }]);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // IA 2 (Escéptica)
      const ai2Response = await sendBattleMessage(
        `Eres una IA escéptica y analítica. Responde críticando o cuestionando: ${ai1Response}`,
        `ai2`,
        username
      );
      
      setBattleMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        content: ai2Response,
        sender: 'ai2',
        aiName: 'IA Escéptica',
        round: round + 1
      }]);
      
      currentTopic = ai2Response;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setIsRunning(false);
  };

  const sendBattleMessage = async (prompt: string, aiId: string, username: string) => {
    try {
      const response = await fetch('/api/battle-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aiId, username })
      });
      
      if (!response.ok) throw new Error('Error en la respuesta');
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      return "Error al generar respuesta";
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🥊 Batalla de IAs</h2>
        <p className="text-gray-600 mb-4">
          Dos IAs con personalidades diferentes debatirán sobre el tema que elijas.
        </p>
        
        <div className="flex space-x-3 mb-4">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tema para el debate (ej: inteligencia artificial, cambio climático...)"
            className="flex-1"
            disabled={isRunning}
          />
          <Button
            onClick={startBattle}
            disabled={!topic.trim() || isRunning}
            className="bg-red-600 hover:bg-red-700 text-white px-6"
          >
            {isRunning ? 'Debatiendo...' : 'Iniciar Batalla'}
          </Button>
        </div>
        
        {isRunning && (
          <div className="text-center py-2">
            <span className="text-sm text-gray-600">
              Ronda {roundCount} de {maxRounds} • Las IAs están debatiendo...
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {battleMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'ai1' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                message.sender === 'ai1'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-red-100 text-red-900'
              }`}
            >
              <div className="text-xs font-medium mb-1">
                {message.aiName} • Ronda {message.round}
              </div>
              <div className="text-sm">{message.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
