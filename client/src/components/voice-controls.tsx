
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface VoiceControlsProps {
  onTranscriptReceived: (transcript: string) => void;
  isProcessing: boolean;
  lastAiMessage?: string;
}

export function VoiceControls({ 
  onTranscriptReceived, 
  isProcessing, 
  lastAiMessage 
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Auto-speak AI responses when voice is enabled
  useEffect(() => {
    if (lastAiMessage && voiceEnabled) {
      setTimeout(() => {
        speakMessage(lastAiMessage);
      }, 500);
    }
  }, [lastAiMessage, voiceEnabled]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscriptReceived(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Error de micrófono",
          description: "No se pudo acceder al micrófono",
          variant: "destructive",
        });
      };
    }
  }, [toast, onTranscriptReceived]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakMessage = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      stopSpeaking();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Controles de Voz</h3>
      
      {/* Voice Toggle */}
      <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVoice}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            {voiceEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {voiceEnabled ? "Voz Activada" : "Voz Desactivada"}
            </p>
            <p className="text-xs text-gray-500">
              {voiceEnabled ? "Las respuestas se reproducirán automáticamente" : "Las respuestas no se reproducirán"}
            </p>
          </div>
        </div>
      </div>

      {/* Speech Recognition */}
      <div className="space-y-4">
        <div className="text-center">
          <Button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing || !recognitionRef.current}
            className={`p-6 rounded-full transition-all ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg scale-110' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
          
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700">
              {isListening ? "Escuchando..." : "Toca para hablar"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {isListening ? "Habla ahora, se detendrá automáticamente" : "Presiona el botón y di tu mensaje"}
            </p>
          </div>
        </div>

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="flex items-center justify-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">Reproduciendo respuesta...</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={stopSpeaking}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
            >
              <div className="w-3 h-3 border-2 border-current rounded-sm"></div>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
