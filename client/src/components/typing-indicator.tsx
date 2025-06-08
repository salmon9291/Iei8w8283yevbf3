export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3 animate-fade-in">
      <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
      </div>
      <div className="bg-white rounded-lg rounded-tl-sm px-4 py-3 border border-gray-100">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
