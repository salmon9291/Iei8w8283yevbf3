import type { Message } from "@shared/schema";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  onSpeak?: () => void;
}

export function MessageBubble({ message, onSpeak }: MessageBubbleProps) {
  const isUser = message.sender === "user";
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex items-start space-x-3 animate-fade-in ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
        </div>
      )}
      
      <div className={`relative group ${
        isUser 
          ? 'bg-gray-800 rounded-lg rounded-tr-sm px-4 py-3 max-w-xs sm:max-w-md lg:max-w-lg' 
          : 'bg-white rounded-lg rounded-tl-sm px-4 py-3 border border-gray-100 max-w-xs sm:max-w-md lg:max-w-lg'
      }`}>
        <p className={`${isUser ? 'text-white' : 'text-gray-800'} whitespace-pre-wrap text-sm`}>
          {message.content}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs ${isUser ? 'text-gray-300' : 'text-gray-500'}`}>
            {timestamp}
          </span>
          {onSpeak && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSpeak}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-gray-500 hover:text-gray-700"
              title="Reproducir"
            >
              <Volume2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
      
      {isUser && (
        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      )}
    </div>
  );
}
