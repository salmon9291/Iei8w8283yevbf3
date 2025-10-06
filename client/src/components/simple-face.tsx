
interface SimpleFaceProps {
  isSpeaking?: boolean;
}

export function SimpleFace({ isSpeaking = false }: SimpleFaceProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Cara con colores de Replit */}
      <div className="relative mb-8">
        
        {/* Logo/Marca de Replit en el fondo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="text-8xl font-bold replit-brand">R</div>
        </div>

        {/* Ojos con estilo Replit */}
        <div className="flex space-x-8 mb-6 justify-center relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-[#F26430] to-[#569CD6] rounded-full border-2 border-white shadow-lg"></div>
          <div className="w-12 h-12 bg-gradient-to-br from-[#F26430] to-[#569CD6] rounded-full border-2 border-white shadow-lg"></div>
        </div>

        {/* Boca - con colores de Replit */}
        <div className="relative mx-auto w-32 h-6 flex items-center justify-center z-10">
          {isSpeaking ? (
            <div className="w-12 h-4 border-2 border-[#F26430] bg-gradient-to-r from-[#F26430] to-[#569CD6] rounded-full mouth-talking-simple shadow-lg"></div>
          ) : (
            <div className="w-16 h-2 bg-gradient-to-r from-[#F26430] to-[#569CD6] rounded-full shadow-lg"></div>
          )}
        </div>

        {/* Indicador de voz */}
        {isSpeaking && (
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <div className="w-2 h-2 bg-[#F26430] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#569CD6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#F26430] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>

      {/* Estado del asistente */}
      <div className="text-center mt-4">
        <p className="text-sm text-[#9BA4B5] mb-1">
          {isSpeaking ? (
            <span className="text-[#F26430] font-semibold">
              <i className="fas fa-microphone mr-2"></i>
              Hablando...
            </span>
          ) : (
            <span className="text-[#569CD6] font-semibold">
              <i className="fas fa-robot mr-2"></i>
              Esperando tu mensaje
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
