
interface SimpleFaceProps {
  isSpeaking?: boolean;
}

export function SimpleFace({ isSpeaking = false }: SimpleFaceProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* Cara simple con animaciones vividas */}
      <div className={`relative mb-16 ${isSpeaking ? 'face-glowing' : ''}`}>
        {/* Ojos - con animaciones de parpadeo y rebote */}
        <div className="flex space-x-12 mb-8">
          <div className={`w-20 h-20 bg-white rounded-full eye-blinking ${isSpeaking ? 'eye-active' : ''}`}>
            {/* Pupila animada */}
            <div className={`w-8 h-8 bg-black rounded-full mx-auto mt-6 transition-all duration-300 ${isSpeaking ? 'transform scale-125' : ''}`}></div>
          </div>
          <div className={`w-20 h-20 bg-white rounded-full eye-blinking ${isSpeaking ? 'eye-active' : ''}`}>
            {/* Pupila animada */}
            <div className={`w-8 h-8 bg-black rounded-full mx-auto mt-6 transition-all duration-300 ${isSpeaking ? 'transform scale-125' : ''}`}></div>
          </div>
        </div>
        
        {/* Boca - con animaciones más vividas */}
        <div className="relative mx-auto w-32 h-6 flex items-center justify-center">
          {isSpeaking ? (
            // Boca animada vivida cuando habla
            <div className="relative">
              <div className="w-16 h-8 border-2 border-white bg-black mouth-talking transition-all duration-200"></div>
              {/* Efectos adicionales */}
              <div className="absolute -inset-2 border border-white rounded-full opacity-30 animate-pulse"></div>
            </div>
          ) : (
            // Boca normal - sonrisa sutil
            <div className="w-20 h-2 bg-white rounded-full transition-all duration-300 hover:scale-110"></div>
          )}
        </div>

        {/* Efectos de partículas cuando habla */}
        {isSpeaking && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-8 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-6 right-10 w-1 h-1 bg-white rounded-full animate-bounce opacity-60" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute bottom-8 left-12 w-1 h-1 bg-white rounded-full animate-pulse opacity-50" style={{ animationDelay: '0.4s' }}></div>
            <div className="absolute bottom-6 right-8 w-2 h-2 bg-white rounded-full animate-ping opacity-40" style={{ animationDelay: '0.6s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
