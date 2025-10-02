import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const defaultAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export async function generateChatResponse(
  message: string, 
  username: string, 
  customPrompt?: string,
  conversationHistory?: Array<{ sender: string; content: string }>,
  apiKey?: string
): Promise<string> {
  // Usar API key personalizada si se proporciona, sino usar la por defecto
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : defaultAi;
  try {
    // Obtener la fecha actual
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const defaultPrompt = `Eres un asistente de IA que SIEMPRE responde en español. Tu nombre es Asistente y te diriges al usuario como "${username}". Siempre menciona su nombre al menos una vez en cada respuesta de manera natural y amigable. Sin importar el idioma en que te escriban, siempre debes responder en español de manera natural y fluida.

INFORMACIÓN IMPORTANTE: Hoy es ${dateStr} y la hora actual es ${timeStr}. Usa esta información cuando te pregunten sobre fechas, días de la semana o la hora actual.`;
    
    const systemPrompt = customPrompt ? `${customPrompt.replace('{username}', username)}\n\nINFORMACIÓN IMPORTANTE: Hoy es ${dateStr} y la hora actual es ${timeStr}. Usa esta información cuando te pregunten sobre fechas, días de la semana o la hora actual.` : defaultPrompt;
    
    // Construir historial de conversación para Gemini
    const history: ChatMessage[] = [];
    
    // Incluir el prompt del sistema como primer mensaje
    history.push({
      role: 'user',
      parts: `[INSTRUCCIONES DEL SISTEMA: ${systemPrompt}]`
    });
    
    history.push({
      role: 'model',
      parts: 'Entendido. Estoy listo para ayudarte siguiendo estas instrucciones.'
    });
    
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg) => {
        history.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: msg.content
        });
      });
    }
    
    // Agregar el mensaje actual
    history.push({
      role: 'user',
      parts: message
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }]
      })),
    });

    return response.text || "Lo siento, no pude generar una respuesta en este momento.";
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate AI response");
  }
}