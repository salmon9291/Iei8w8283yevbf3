
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "@/hooks/use-chat";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { VoiceControls } from "./voice-controls";
import { ThemeToggle } from "./theme-toggle";
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
  const [aiPrompt, setAiPrompt] = useState(`Eres un asistente de IA que SIEMPRE responde en español. Tu nombre es Asistente y te diriges al usuario como "${username}". Siempre menciona su nombre al menos una vez en cada respuesta de manera natural y amigable. Sin importar el idioma en que te escriban, siempre debes responder en español de manera natural y fluida.`);
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

  // Actualizar prompt cuando cambie el username
  useEffect(() => {
    const newPrompt = `Eres un asistente de IA que SIEMPRE responde en español. Tu nombre es Asistente y te diriges al usuario como "${username}". Siempre menciona su nombre al menos una vez en cada respuesta de manera natural y amigable. Sin importar el idioma en que te escriban, siempre debes responder en español de manera natural y fluida.`;
    setAiPrompt(newPrompt);
    setTempPrompt(newPrompt);
  }, [username]);

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

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      localStorage.removeItem('auth_user');
      onClearUsername();
    }
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
    { 
      id: 'chat' as TabType, 
      label: 'Chat', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    { 
      id: 'voice' as TabType, 
      label: 'Voz', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    { 
      id: 'ai-battle' as TabType, 
      label: 'Debate', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      )
    },
    { 
      id: 'accounts' as TabType, 
      label: 'Chats', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    },
    { 
      id: 'settings' as TabType, 
      label: 'Configuración', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
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
            <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-3 md:px-6 py-3 md:py-4">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2 md:space-x-3">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu mensaje..."
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50 dark:bg-gray-700"
                    maxLength={1000}
                    disabled={isSending}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!messageText.trim() || isSending}
                  className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-700 text-white p-2 md:p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex-1 p-3 md:p-6 space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Gestión de Chats</h3>
              </div>
              
              {/* Guardar chat actual */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center space-x-2 mb-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">Guardar Chat Actual</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                    <Input
                      value={currentChatName}
                      onChange={(e) => setCurrentChatName(e.target.value)}
                      placeholder="Nombre del chat..."
                      className="flex-1 text-sm"
                      maxLength={50}
                    />
                    <Button
                      onClick={saveCurrentChat}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 text-sm font-medium w-full md:w-auto"
                    >
                      Guardar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Mensajes actuales: {messages.length}</span>
                    {messages.length === 0 && (
                      <span className="text-orange-500">Sin mensajes para guardar</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de chats guardados */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">Chats Guardados ({savedChats.length})</h4>
                {savedChats.length > 0 && (
                  <Button
                    onClick={deleteAllChats}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 text-xs"
                  >
                    Eliminar Todos
                  </Button>
                )}
              </div>

              {savedChats.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No tienes chats guardados</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 md:max-h-96 overflow-y-auto">
                  {savedChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                          {chat.name}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {chat.messages.length} mensajes • {new Date(chat.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 text-xs px-2 py-1"
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Configuración del Prompt de IA</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt personalizado:
                  </label>
                  <Textarea
                    value={tempPrompt}
                    onChange={(e) => setTempPrompt(e.target.value)}
                    placeholder="Escribe aquí cómo quieres que se comporte la IA..."
                    className="w-full h-32 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  />
                </div>
                <Button
                  onClick={handleSavePrompt}
                  className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Guardar Configuración
                </Button>
              </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Información de Usuario</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Usuario:</strong> {username}</p>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900"
                >
                  Cerrar Sesión
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col">
        {/* Header with Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <div className="px-3 md:px-6 py-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-800 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"></div>
                </div>
                <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-32 md:max-w-none">{username}</span>
              </div>

              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  disabled={isClearing}
                  className="p-1 md:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Limpiar chat"
                >
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-0 px-2 md:px-6 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap min-w-0 ${
                  activeTab === tab.id
                    ? 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-b-2 border-blue-500 dark:border-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 border-b-2 border-transparent'
                }`}
              >
                <div className={`${activeTab === tab.id ? 'text-blue-500 dark:text-blue-400' : ''}`}>
                  {tab.icon}
                </div>
                <span className="hidden sm:inline truncate">{tab.label}</span>
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
      const ai1Prompt = round === 0 
        ? `Eres una IA optimista y entusiasta llamada "Optimista". Estás en un debate con otra IA llamada "Escéptica". Responde de manera positiva y entusiasta sobre el tema: ${currentTopic}. NO te dirijas al usuario, habla directamente como si fueras un participante del debate.`
        : `Eres una IA optimista y entusiasta llamada "Optimista". Estás debatiendo con "Escéptica". Responde de manera positiva y entusiasta a este argumento: "${currentTopic}". Contraargumenta de forma constructiva y optimista. NO menciones al usuario.`;
      
      const ai1Response = await sendBattleMessage(ai1Prompt, `ai1`, username);
      
      setBattleMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        content: ai1Response,
        sender: 'ai1',
        aiName: 'IA Optimista',
        round: round + 1
      }]);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // IA 2 (Escéptica)
      const ai2Prompt = `Eres una IA escéptica y analítica llamada "Escéptica". Estás debatiendo con "Optimista". Responde de manera crítica y analítica a este argumento: "${ai1Response}". Cuestiona los puntos débiles y presenta contraargumentos razonados. NO menciones al usuario.`;
      
      const ai2Response = await sendBattleMessage(ai2Prompt, `ai2`, username);
      
      setBattleMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        content: ai2Response,
        sender: 'ai2',
        aiName: 'IA Escéptica',
        round: round + 1
      }]);
      
      currentTopic = ai2Response;
      await new Promise(resolve => setTimeout(resolve, 1500));
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
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Debate de IAs</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Observa cómo dos IAs con personalidades opuestas debaten sobre cualquier tema.
        </p>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Tema para el debate (ej: inteligencia artificial, educación, medio ambiente...)"
              className="flex-1 text-sm"
              disabled={isRunning}
            />
            <Button
              onClick={startBattle}
              disabled={!topic.trim() || isRunning}
              className="bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 w-full md:w-auto"
            >
              {isRunning ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Debatiendo...</span>
                </div>
              ) : (
                'Iniciar Debate'
              )}
            </Button>
          </div>
          
          {isRunning && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Ronda {roundCount} de {maxRounds}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600 dark:text-gray-400">Debate en progreso</span>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(roundCount / maxRounds) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {battleMessages.length === 0 && !isRunning && (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Introduce un tema arriba para comenzar el debate
            </p>
          </div>
        )}
        
        {battleMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'ai1' ? 'justify-start' : 'justify-end'} animate-fadeIn`}
          >
            <div
              className={`max-w-[90%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm border ${
                message.sender === 'ai1'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  message.sender === 'ai1' ? 'bg-blue-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs font-semibold opacity-75">
                  {message.aiName}
                </span>
                <span className="text-xs opacity-50">
                  Ronda {message.round}
                </span>
              </div>
              <div className="text-sm leading-relaxed">{message.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
