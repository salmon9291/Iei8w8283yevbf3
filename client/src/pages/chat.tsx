import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Chat() {
  const [username, setUsername] = useState<string>("");
  const [showNameInput, setShowNameInput] = useState(true);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    // Verificar si ya hay un nombre guardado
    const savedName = localStorage.getItem('user_name');
    if (savedName && savedName.trim()) {
      setUsername(savedName);
      setShowNameInput(false);
    }
  }, []);

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = tempName.trim();
    if (trimmedName.length >= 2) {
      setUsername(trimmedName);
      localStorage.setItem('user_name', trimmedName);
      setShowNameInput(false);
    }
  };

  const handleChangeName = () => {
    setShowNameInput(true);
    setTempName(username);
  };

  if (showNameInput) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            {/* Avatar del asistente */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-300 to-purple-500 flex items-center justify-center">
                {/* Ojos */}
                <div className="absolute top-5 left-5 w-2 h-2 bg-white rounded-full"></div>
                <div className="absolute top-5 right-5 w-2 h-2 bg-white rounded-full"></div>
                {/* Boca sonriente */}
                <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-6 h-3 border-b-2 border-white rounded-full"></div>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              ¡Hola! Soy tu Asistente IA
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Dime tu nombre para comenzar a conversar
            </p>
          </div>
          
          <form onSubmit={handleStartChat} className="space-y-4">
            <div>
              <Input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Tu nombre..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700"
                required
                minLength={2}
                maxLength={20}
                autoFocus
                data-testid="input-username"
              />
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={tempName.trim().length < 2}
              data-testid="button-start-chat"
            >
              Comenzar a Conversar 🚀
            </Button>
          </form>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            Tu nombre se guardará para futuras conversaciones
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <ChatInterface username={username} />
      
      {/* Botón flotante para cambiar nombre */}
      <button
        onClick={handleChangeName}
        className="fixed top-4 right-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 z-10"
        title="Cambiar nombre"
        data-testid="button-change-name"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}