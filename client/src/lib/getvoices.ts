
const GETVOICES_API_KEY = "3f4eb02d-093a-4397-998d-9064db07a811";
const GETVOICES_API_URL = "https://api.getvoices.ai/v1";

interface VoiceRequest {
  text: string;
  voice_id: string;
  model_id?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface VoiceResponse {
  audio_url: string;
  audio_base64?: string;
}

export async function generateVoiceAudio(text: string, voiceId: string = "genny"): Promise<string> {
  try {
    const response = await fetch(`${GETVOICES_API_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GETVOICES_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice_id: voiceId,
        model_id: "eleven_multilingual_v2",
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true
      } as VoiceRequest)
    });

    if (!response.ok) {
      throw new Error(`GetVoices API error: ${response.status}`);
    }

    const data: VoiceResponse = await response.json();
    return data.audio_url || data.audio_base64 || "";
  } catch (error) {
    console.error("Error generating voice:", error);
    throw error;
  }
}

export async function playVoiceAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    
    audio.onloadeddata = () => {
      audio.play().then(resolve).catch(reject);
    };
    
    audio.onerror = () => {
      reject(new Error("Error loading audio"));
    };
    
    audio.onended = () => {
      resolve();
    };
  });
}
