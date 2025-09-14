interface AssistantFaceProps {
  isSpeaking: boolean;
}

export function AssistantFace({ isSpeaking }: AssistantFaceProps) {
  return (
    <div className="face-container mb-8">
      <div 
        className={`face ${isSpeaking ? 'speaking' : ''}`}
        data-testid="assistant-face"
      >
        😊
      </div>
      {isSpeaking && (
        <div className="voice-indicator active" data-testid="voice-indicator"></div>
      )}
    </div>
  );
}
