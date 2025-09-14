
interface SimpleFaceProps {
  isSpeaking?: boolean;
}

export function SimpleFace({ isSpeaking = false }: SimpleFaceProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* Cara simple - dos círculos y una línea */}
      <div className="relative mb-16">
        {/* Ojos - dos círculos blancos con parpadeo ocasional */}
        <div className="flex space-x-12 mb-8">
          <div className={`w-20 h-20 bg-white rounded-full transition-all duration-150 ${
            isSpeaking ? 'animate-pulse' : ''
          }`}></div>
          <div className={`w-20 h-20 bg-white rounded-full transition-all duration-150 ${
            isSpeaking ? 'animate-pulse' : ''
          }`}></div>
        </div>
        
        {/* Boca - diferentes formas según si está hablando */}
        <div className="relative mx-auto w-32 h-6 flex items-center justify-center">
          {isSpeaking ? (
            // Boca animada cuando habla - alternando entre formas
            <div className="relative">
              <div className="w-20 h-12 border-4 border-white rounded-full animate-pulse"></div>
              <div className="absolute top-1 left-1 w-18 h-10 bg-black rounded-full"></div>
            </div>
          ) : (
            // Boca normal - línea horizontal
            <div className="w-32 h-2 bg-white rounded"></div>
          )}
        </div>
        
        {/* Indicador de voz adicional cuando habla */}
        {isSpeaking && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              <div className="w-2 h-6 bg-white rounded animate-bounce"></div>
              <div className="w-2 h-8 bg-white rounded animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-4 bg-white rounded animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
