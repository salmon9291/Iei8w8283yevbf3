
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

type TabType = 'chat' | 'voice' | 'ai-battle' | 'settings' | 'accounts';

export function ChatInterface({ username, onClearUsername }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [lastAiMessage, setLastAiMessage] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState("Eres un asistente de IA que SIEMPRE responde en español. Sin importar el idioma en que te escriban, siempre debes responder en español de manera natural y fluida.");
  const [tempPrompt, setTempPrompt] = useState(aiPrompt);
  const [savedChats, setSavedChats] = useState<any[]>([]);
  const [currentChatName, setCurrentChatName] = useState("");
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

  const saveCurrentChat = () => {
    if (!currentChatName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para el chat",
        variant: "destructive",
      });
      return;
    }

    if (messages.length === 0) {
      toast({
        title: "Error",
        description: "No hay mensajes para guardar",
        variant: "destructive",
      });
      return;
    }

    const chatData = {
      id: Date.now(),
      name: currentChatName.trim(),
      messages: messages,
      username: username,
      createdAt: new Date().toISOString(),
      prompt: aiPrompt
    };

    const existingSaved = JSON.parse(localStorage.getItem('savedChats') || '[]');
    const updatedChats = [...existingSaved, chatData];
    localStorage.setItem('savedChats', JSON.stringify(updatedChats));
    setSavedChats(updatedChats);
    setCurrentChatName("");

    toast({
      title: "Chat guardado",
      description: `Chat "${chatData.name}" guardado exitosamente`,
    });
  };

  const loadSavedChats = () => {
    const saved = JSON.parse(localStorage.getItem('savedChats') || '[]');
    setSavedChats(saved);
  };

  const loadChat = (chatData: any) => {
    // Esta función necesitaría ser implementada en el hook useChat
    toast({
      title: "Función no implementada",
      description: "La carga de chats se implementará en una actualización futura",
      variant: "destructive",
    });
  };

  const deleteChat = (chatId: number) => {
    const existingSaved = JSON.parse(localStorage.getItem('savedChats') || '[]');
    const updatedChats = existingSaved.filter((chat: any) => chat.id !== chatId);
    localStorage.setItem('savedChats', JSON.stringify(updatedChats));
    setSavedChats(updatedChats);

    toast({
      title: "Chat eliminado",
      description: "El chat ha sido eliminado exitosamente",
    });
  };

  const deleteAllChats = () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar todos los chats guardados? Esta acción no se puede deshacer.")) {
      localStorage.removeItem('savedChats');
      setSavedChats([]);
      toast({
        title: "Todos los chats eliminados",
        description: "Se han eliminado todos los chats guardados",
      });
    }
  };

  // Cargar chats guardados al montar el componente
  useEffect(() => {
    loadSavedChats();
  }, []);

  const tabs = [
    { id: 'chat' as TabType, label: 'Chat', icon: '💬' },
    { id: 'voice' as TabType, label: 'Voz', icon: '🎤' },
    { id: 'ai-battle' as TabType, label: 'Debate', icon: '🗣️' },
    { id: 'accounts' as TabType, label: 'Chats', icon: '💾' },
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
            <div className="bg-white border-t border-gray-100 px-3 md:px-6 py-3 md:py-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2 md:space-x-3">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu mensaje..."
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50"
                    maxLength={1000}
                    disabled={isSending}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className="bg-gray-800 hover:bg-gray-900 text-white p-2 md:p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
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

      case 'accounts':
        return (
          <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">💾 Gestión de Chats</h3>
              
              {/* Guardar chat actual */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800">Guardar Chat Actual</h4>
                <div className="flex space-x-2">
                  <Input
                    value={currentChatName}
                    onChange={(e) => setCurrentChatName(e.target.value)}
                    placeholder="Nombre del chat..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={saveCurrentChat}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 text-sm"
                  >
                    Guardar
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  Mensajes actuales: {messages.length}
                </p>
              </div>
            </div>

            {/* Lista de chats guardados */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">Chats Guardados ({savedChats.length})</h4>
                {savedChats.length > 0 && (
                  <Button
                    onClick={deleteAllChats}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                  >
                    Eliminar Todos
                  </Button>
                )}
              </div>

              {savedChats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No tienes chats guardados</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 md:max-h-96 overflow-y-auto">
                  {savedChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 truncate text-sm">
                          {chat.name}
                        </h5>
                        <p className="text-xs text-gray-500">
                          {chat.messages.length} mensajes • {new Date(chat.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          Usuario: {chat.username}
                        </p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          onClick={() => loadChat(chat)}
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1"
                        >
                          Cargar
                        </Button>
                        <Button
                          onClick={() => deleteChat(chat.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

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
          <div className="px-3 md:px-6 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"></div>
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700 truncate max-w-32 md:max-w-none">{username}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                disabled={isClearing}
                className="p-1 md:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                title="Limpiar chat"
              >
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-0 md:space-x-1 px-2 md:px-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gray-50 text-gray-900 border-b-2 border-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm md:text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
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
    <div className="flex-1 flex flex-col p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">🗣️ Debate entre IAs</h2>
        <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
          Dos IAs con personalidades diferentes debatirán sobre el tema que elijas.
        </p>
        
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 mb-4">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tema para el debate (ej: inteligencia artificial...)"
            className="flex-1 text-sm"
            disabled={isRunning}
          />
          <Button
            onClick={startBattle}
            disabled={!topic.trim() || isRunning}
            className="bg-red-600 hover:bg-red-700 text-white px-4 md:px-6 text-sm md:text-base w-full md:w-auto"
          >
            {isRunning ? 'Debatiendo...' : 'Iniciar Debate'}
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
              className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-lg ${
                message.sender === 'ai1'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-red-100 text-red-900'
              }`}
            >
              <div className="text-xs font-medium mb-1">
                {message.aiName} • Ronda {message.round}
              </div>
              <div className="text-xs md:text-sm">{message.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
