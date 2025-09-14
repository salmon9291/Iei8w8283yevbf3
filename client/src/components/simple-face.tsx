interface SimpleFaceProps {
  isSpeaking?: boolean;
}

export function SimpleFace({ isSpeaking = false }: SimpleFaceProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* Cara simple - dos círculos y una línea */}
      <div className="relative mb-16">
        {/* Ojos - dos círculos blancos */}
        <div className="flex space-x-12 mb-8">
          <div className="w-20 h-20 bg-white rounded-full"></div>
          <div className="w-20 h-20 bg-white rounded-full"></div>
        </div>
        
        {/* Boca - línea horizontal */}
        <div className={`w-32 h-2 bg-white mx-auto transition-all duration-300 ${
          isSpeaking ? 'h-3 rounded-full' : 'rounded'
        }`}></div>
      </div>
      
      {/* Texto "chat" en la parte inferior */}
      <div className="absolute bottom-16 left-8">
        <h1 className="text-white text-4xl font-light">chat</h1>
      </div>
    </div>
  );
}