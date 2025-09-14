import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Chat() {
  const [username, setUsername] = useState<string>("");
  const [showNameInput, setShowNameInput] = useState(true);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
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

  if (showNameInput) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          {/* Cara simple para la pantalla de entrada */}
          <div className="mb-12">
            <div className="flex space-x-8 mb-6 justify-center">
              <div className="w-16 h-16 bg-white rounded-full"></div>
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </div>
            <div className="w-24 h-1.5 bg-white mx-auto rounded"></div>
          </div>
          
          <form onSubmit={handleStartChat} className="space-y-6">
            <Input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Tu nombre..."
              className="w-80 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-white text-center text-lg"
              required
              minLength={2}
              maxLength={20}
              autoFocus
              data-testid="input-username"
            />
            
            <Button 
              type="submit"
              className="w-80 bg-white text-black hover:bg-gray-200 text-lg py-3"
              disabled={tempName.trim().length < 2}
              data-testid="button-start-chat"
            >
              Comenzar
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <ChatInterface username={username} />;
}