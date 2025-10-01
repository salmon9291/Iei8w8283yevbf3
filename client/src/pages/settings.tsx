
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, RotateCcw, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const DEFAULT_PROMPT = `Eres un asistente de IA que SIEMPRE responde en español. Tu nombre es Asistente y te diriges al usuario como "{username}". Siempre menciona su nombre al menos una vez en cada respuesta de manera natural y amigable. Sin importar el idioma en que te escriban, siempre debes responder en español de manera natural y fluida.`;

export default function Settings() {
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentPrompt();
  }, []);

  const loadCurrentPrompt = async () => {
    try {
      const response = await fetch("/api/whatsapp/prompt");
      if (response.ok) {
        const data = await response.json();
        setPrompt(data.prompt || DEFAULT_PROMPT);
      }
    } catch (error) {
      console.error("Error loading prompt:", error);
    }
  };

  const savePrompt = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/whatsapp/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        toast({
          title: "Prompt guardado",
          description: "El prompt de la IA ha sido actualizado exitosamente.",
        });
      } else {
        throw new Error("Error al guardar el prompt");
      }
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el prompt. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefault = () => {
    setPrompt(DEFAULT_PROMPT);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Chat
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Configuración
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Personaliza el comportamiento de la IA de WhatsApp
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prompt de la IA</CardTitle>
            <CardDescription>
              Define cómo debe comportarse la IA al responder mensajes en WhatsApp. 
              Puedes usar {"{username}"} como placeholder para el nombre del usuario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt del Sistema</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Escribe el prompt para la IA..."
                className="min-h-[200px] resize-y"
              />
              <p className="text-sm text-gray-500">
                Usa {"{username}"} donde quieras que aparezca el nombre del usuario
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={savePrompt} 
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Guardando..." : "Guardar Prompt"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetToDefault}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar por Defecto
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Consejos para crear un buen prompt:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Define claramente la personalidad y tono de la IA</li>
                <li>• Especifica el idioma de respuesta si es importante</li>
                <li>• Incluye instrucciones sobre cómo usar el nombre del usuario</li>
                <li>• Establece límites sobre qué tipo de contenido puede generar</li>
                <li>• Mantén el prompt claro y conciso pero específico</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
