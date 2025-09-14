
interface SimpleFaceProps {
  isSpeaking?: boolean;
}

export function SimpleFace({ isSpeaking = false }: SimpleFaceProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* Cara simple - dos círculos y una línea */}
      <div className="relative mb-16">
        {/* Ojos - dos círculos blancos fijos */}
        <div className="flex space-x-12 mb-8">
          <div className="w-20 h-20 bg-white rounded-full"></div>
          <div className="w-20 h-20 bg-white rounded-full"></div>
        </div>
        
        {/* Boca - diferentes formas según si está hablando */}
        <div className="relative mx-auto w-32 h-6 flex items-center justify-center">
          {isSpeaking ? (
            // Boca animada cuando habla - formas suaves
            <div className="relative">
              <div className="w-16 h-8 border-2 border-white rounded-full mouth-talking"></div>
            </div>
          ) : (
            // Boca normal - línea horizontal
            <div className="w-32 h-2 bg-white rounded"></div>
          )}
        </div>
      </div>
    </div>
  );
}
