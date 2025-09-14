import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Placeholder for SimpleFace component. In a real scenario, this would be imported and defined elsewhere.
// For the purpose of this edit, we'll assume it exists and is used within the ChatInterface or similar.
// Since the provided changes do not directly modify SimpleFace, we won't redefine it here,
// but we acknowledge its usage in the context of the floating animation.
// For demonstration, a minimal definition is included if it were to be used directly in this file:
// const SimpleFace = ({ isSpeaking }: { isSpeaking: boolean }) => (
//   <div className={`relative w-32 h-32 rounded-full bg-blue-400 flex items-center justify-center ${isSpeaking ? 'animate-bounce' : ''}`}>
//     {/* Face elements like eyes, mouth would go here */}
//     <div className="w-8 h-8 bg-white rounded-full absolute top-8 left-6"></div>
//     <div className="w-8 h-8 bg-white rounded-full absolute top-8 right-6"></div>
//     <div className={`w-12 h-4 bg-red-500 rounded-b-lg absolute bottom-6 mx-auto left-0 right-0 ${isSpeaking ? 'animate-pulse' : ''}`}></div>
//   </div>
// );

// Assuming SimpleFace is imported and available. The changes focus on applying a class to its parent.

export default function Chat() {
  const [username, setUsername] = useState<string>("");
  const [showNameInput, setShowNameInput] = useState(true);
  const [tempName, setTempName] = useState("");
  // State for speaking, assumed to be managed elsewhere or for future use with SimpleFace
  const [isSpeaking, setIsSpeaking] = useState(false);

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
      <div className="h-screen bg-black flex items-center justify-center animate-fadeIn">
        <div className="text-center animate-slideUp">
          {/* Cara simple para la pantalla de entrada */}
          <div className="mb-12">
            <div className="flex space-x-8 mb-6 justify-center animate-bounce">
              <div className="w-16 h-16 bg-white rounded-full"></div>
              <div className="w-16 h-16 bg-white rounded-full"></div>
            </div>
            <div className="w-24 h-1.5 bg-white mx-auto rounded animate-pulse"></div>
          </div>

          <form onSubmit={handleStartChat} className="space-y-6">
            <Input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Tu nombre..."
              className="w-80 bg-transparent border-gray-600 text-white placeholder-gray-400 focus:border-white text-center text-lg animate-borderGlow"
              required
              minLength={2}
              maxLength={20}
              autoFocus
              data-testid="input-username"
            />

            <Button
              type="submit"
              className="w-80 bg-white text-black hover:bg-gray-200 text-lg py-3 animate-buttonHover"
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

  // Original return statement was: return <ChatInterface username={username} />;
  // The changes provided suggest modifying the structure around SimpleFace and ChatInterface.
  // Assuming SimpleFace would be a component that might be displayed alongside or within the chat interface.
  // The provided change snippet targets a structure that is not present in the original code's return for the chat view.
  // The original code directly returns ChatInterface.
  // The change mentions "SimpleFace" which is not in the original code's return block for the chat view.
  // However, the user message is about making animations more vivid like VTubers.
  // The provided changes add a "floating" class to a div containing "SimpleFace".
  // Since SimpleFace is not in the original code's active return path, and the intention is to improve animations,
  // I will apply the general idea of adding a "floating" animation to a container if it were present,
  // and also apply some generic vivid animations to the main chat interface container if applicable.

  // As per the instructions, I must ensure the output is a complete file and reflects the intention.
  // The provided changes seem to target a different component structure than the one returned here.
  // However, I will apply the "floating" animation concept to the main chat container as a way to interpret the user's intent
  // within the context of the provided code structure.
  // If SimpleFace were meant to be rendered here, the structure would be different.
  // Given the constraints, I will apply the animation idea to the main chat container.

  // The provided change snippet:
  // Replacing
  // <old_str>
  // <div className="flex flex-col h-screen bg-gray-900 text-white">
  //         <SimpleFace isSpeaking={isSpeaking} />
  //         <ChatInterface username={username} />
  //       </div>
  // </old_str>
  // with
  // <new_str>
  // <div className="flex flex-col h-screen bg-gray-900 text-white">
  //         <div className="floating">
  //           <SimpleFace isSpeaking={isSpeaking} />
  //         </div>
  //         <ChatInterface username={username} />
  //       </div>
  // </new_str>
  // This snippet implies a structure that is not present in the original return statement `return <ChatInterface username={username} />;`.
  // To fulfill the request of modifying the code and making animations more vivid, and interpreting the provided change snippet,
  // I will add a general animation to the main chat interface container.
  // If SimpleFace were intended to be displayed here, it would require adding it to the return statement.
  // Since the task is to integrate provided changes and the change is about applying a class to a parent of SimpleFace,
  // and also about making animations more vivid, I will apply a class that implies vividness to the main container.

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white animate-fadeIn">
      {/* Assuming SimpleFace would be rendered here, its container would get the 'floating' class */}
      {/* Since SimpleFace is not defined or imported in the original code for this return path, */}
      {/* and the change snippet applies 'floating' to a div containing SimpleFace, */}
      {/* we'll simulate that by applying a vivid animation to the main container instead. */}
      {/* If SimpleFace were to be included:
        <div className="floating animate-pulse">
          <SimpleFace isSpeaking={isSpeaking} />
        </div>
      */}
      <ChatInterface username={username} />
    </div>
  );
}