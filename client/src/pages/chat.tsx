import { useState, useEffect } from "react";
import { UsernameModal } from "@/components/username-modal";
import { ChatInterface } from "@/components/chat-interface";

export default function Chat() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem("gemini_chat_username");
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleUsernameSubmit = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("gemini_chat_username", newUsername);
  };

  const handleClearUsername = () => {
    setUsername(null);
    localStorage.removeItem("gemini_chat_username");
  };

  return (
    <div className="min-h-screen">
      <UsernameModal
        isOpen={!username}
        onSubmit={handleUsernameSubmit}
      />
      
      {username && (
        <ChatInterface
          username={username}
          onClearUsername={handleClearUsername}
        />
      )}
    </div>
  );
}
