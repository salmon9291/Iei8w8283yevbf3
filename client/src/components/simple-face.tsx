interface SimpleFaceProps {
  isSpeaking?: boolean;
}

export function SimpleFace({ isSpeaking = false }: SimpleFaceProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {/* Cara simple y tierna */}
      <div className="relative mb-16">

        {/* Solo la boca - más tierna y simple */}
        <div className="relative mx-auto w-32 h-6 flex items-center justify-center">
          {isSpeaking ? (
            // Boca cuando habla - más sutil
            <div className="w-12 h-4 border-2 border-white bg-transparent rounded-full mouth-talking-simple"></div>
          ) : (
            // Boca normal - sonrisa tierna
            <div className="w-16 h-2 bg-white rounded-full"></div>
          )}
        </div>

      </div>
    </div>
  );
}