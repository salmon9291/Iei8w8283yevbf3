import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UsernameModalProps {
  isOpen: boolean;
  onSubmit: (username: string) => void;
}

export function UsernameModal({ isOpen, onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (trimmedUsername.length >= 2 && trimmedUsername.length <= 20) {
      onSubmit(trimmedUsername);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-sm bg-white rounded-lg p-6 border border-gray-200">
        <DialogHeader className="text-center mb-4">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <DialogTitle className="text-lg font-medium text-gray-900 mb-1">
            Chat con AI
          </DialogTitle>
          <p className="text-sm text-gray-600">Ingresa tu nombre para comenzar</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre..."
              className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50"
              required
              minLength={2}
              maxLength={20}
              autoFocus
            />
          </div>
          
          <Button 
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50"
            disabled={username.trim().length < 2}
          >
            Comenzar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
