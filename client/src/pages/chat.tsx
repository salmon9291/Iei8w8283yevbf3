
import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { AuthModal } from "@/components/auth-modal";

export default function Chat() {
  const [username, setUsername] = useState<string>("");
  const [showAuth, setShowAuth] = useState(true);

  useEffect(() => {
    // Verificar si el usuario ya está autenticado
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      setUsername(savedUser);
      setShowAuth(false);
    }
  }, []);

  const handleAuthSuccess = (user: string) => {
    setUsername(user);
    setShowAuth(false);
  };

  const handleClearUsername = () => {
    setUsername("");
    setShowAuth(true);
  };

  if (showAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <AuthModal
          isOpen={showAuth}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <ChatInterface
      username={username}
      onClearUsername={handleClearUsername}
    />
  );
}
