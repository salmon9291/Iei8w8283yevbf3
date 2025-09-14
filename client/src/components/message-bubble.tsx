import type { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  onSpeak?: (text: string) => void;
}

export function MessageBubble({ message, onSpeak }: MessageBubbleProps) {
  const isUser = message.sender === "user";

  return (
    <div className="message" data-testid={`message-${message.id}`}>
      <div className="flex items-start space-x-3 mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-accent text-accent-foreground'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>
        <div className="flex-1">
          <div className={`rounded-lg px-4 py-2 max-w-md ${
            isUser 
              ? 'bg-secondary text-secondary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <span>{message.content}</span>
            {!isUser && onSpeak && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSpeak(message.content)}
                className="ml-2 p-1 h-auto text-primary hover:text-primary/80"
                data-testid={`button-speak-${message.id}`}
              >
                <i className="fas fa-volume-up text-sm"></i>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
