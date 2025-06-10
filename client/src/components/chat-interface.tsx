
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

type TabType = 'ai-battle' | 'settings' | 'accounts';

export function ChatInterface({ username, onClearUsername }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>('ai-battle');
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
  const [numDebaters, setNumDebaters] = useState(2);
  const [maxRounds, setMaxRounds] = useState(6);
  const [debaters, setDebaters] = useState([
    { id: 1, name: "IA Optimista", personality: "optimista y entusiasta", color: "blue" },
    { id: 2, name: "IA Escéptica", personality: "escéptica y analítica", color: "red" }
  ]);

  const colors = ["blue", "red", "green", "purple", "orange", "pink", "indigo", "yellow"];

  const addDebater = () => {
    if (debaters.length < 8) {
      const newId = debaters.length + 1;
      const newDebater = {
        id: newId,
        name: `IA Debatiente ${newId}`,
        personality: "neutral y equilibrada",
        color: colors[debaters.length % colors.length]
      };
      setDebaters([...debaters, newDebater]);
      setNumDebaters(debaters.length + 1);
    }
  };

  const removeDebater = (id: number) => {
    if (debaters.length > 2) {
      setDebaters(debaters.filter(d => d.id !== id));
      setNumDebaters(debaters.length - 1);
    }
  };

  const updateDebater = (id: number, field: string, value: string) => {
    setDebaters(debaters.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const startBattle = async () => {
    if (!topic.trim()) return;
    
    setIsRunning(true);
    setRoundCount(0);
    setBattleMessages([]);

    let currentTopic = topic;
    
    for (let round = 0; round < maxRounds; round++) {
      setRoundCount(round + 1);
      
      for (let i = 0; i < debaters.length; i++) {
        const debater = debaters[i];
        const otherDebaters = debaters.filter(d => d.id !== debater.id).map(d => d.name).join(", ");
        
        const prompt = round === 0 && i === 0
          ? `Eres una IA ${debater.personality} llamada "${debater.name}". Estás en un debate con ${otherDebaters}. Responde de manera ${debater.personality} sobre el tema: ${currentTopic}. NO te dirijas al usuario, habla directamente como si fueras un participante del debate. Mantén tu respuesta concisa (máximo 150 palabras).`
          : `Eres una IA ${debater.personality} llamada "${debater.name}". Estás debatiendo con ${otherDebaters}. Responde de manera ${debater.personality} a este argumento: "${currentTopic}". Contraargumenta de forma constructiva manteniendo tu personalidad. NO menciones al usuario. Mantén tu respuesta concisa (máximo 150 palabras).`;
        
        const response = await sendBattleMessage(prompt, `ai${debater.id}`, username);
        
        setBattleMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          content: response,
          sender: `ai${debater.id}`,
          aiName: debater.name,
          color: debater.color,
          round: round + 1
        }]);
        
        currentTopic = response;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800',
      red: 'bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800',
      green: 'bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800',
      purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800',
      orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border-orange-200 dark:border-orange-800',
      pink: 'bg-pink-50 dark:bg-pink-900/30 text-pink-900 dark:text-pink-100 border-pink-200 dark:border-pink-800',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 border-indigo-200 dark:border-indigo-800',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800'
    };
    return colorMap[color] || colorMap.blue;
  };

  const getDotColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      yellow: 'bg-yellow-500'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="flex-1 flex flex-col p-3 md:p-6">
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Debate de IAs Múltiples</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configura múltiples IAs con diferentes personalidades para debatir sobre cualquier tema.
        </p>
        
        {/* Configuración de debatientes */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Debatientes ({debaters.length})</h3>
            <Button
              onClick={addDebater}
              disabled={debaters.length >= 8 || isRunning}
              size="sm"
              className="text-xs"
            >
              Agregar Debatiente
            </Button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {debaters.map((debater, index) => (
              <div key={debater.id} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className={`w-3 h-3 rounded-full ${getDotColor(debater.color)}`}></div>
                <Input
                  value={debater.name}
                  onChange={(e) => updateDebater(debater.id, 'name', e.target.value)}
                  className="flex-1 text-xs h-8"
                  placeholder="Nombre del debatiente"
                  disabled={isRunning}
                />
                <Input
                  value={debater.personality}
                  onChange={(e) => updateDebater(debater.id, 'personality', e.target.value)}
                  className="flex-1 text-xs h-8"
                  placeholder="Personalidad"
                  disabled={isRunning}
                />
                {debaters.length > 2 && (
                  <Button
                    onClick={() => removeDebater(debater.id)}
                    disabled={isRunning}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 text-xs p-1 w-8 h-8"
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Configuración del debate */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tema del debate
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Tema para el debate..."
                className="text-sm"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Máximo de rondas
              </label>
              <Input
                type="number"
                value={maxRounds}
                onChange={(e) => setMaxRounds(Math.max(1, Math.min(10, parseInt(e.target.value) || 6)))}
                min={1}
                max={10}
                className="text-sm"
                disabled={isRunning}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={startBattle}
                disabled={!topic.trim() || isRunning}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
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
          </div>
          
          {isRunning && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Ronda {roundCount} de {maxRounds}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {debaters.map((debater, i) => (
                      <div key={debater.id} className={`w-2 h-2 rounded-full ${getDotColor(debater.color)} animate-pulse`}></div>
                    ))}
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">Debate en progreso</span>
                </div>
              </div>
              <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
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
              Configura los debatientes y el tema arriba para comenzar el debate
            </p>
          </div>
        )}
        
        {battleMessages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} animate-fadeIn`}
          >
            <div
              className={`max-w-[90%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm border ${getColorClasses(message.color)}`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${getDotColor(message.color)}`}></div>
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
