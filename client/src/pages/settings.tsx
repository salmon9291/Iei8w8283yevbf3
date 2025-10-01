
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save, RotateCcw, ArrowLeft, Users } from "lucide-react";
import { Link } from "wouter";

const DEFAULT_PROMPT = `Eres un asistente de IA que SIEMPRE responde en español. Tu nombre es Asistente y te diriges al usuario como "{username}". Siempre menciona su nombre al menos una vez en cada respuesta de manera natural y amigable. Sin importar el idioma en que te escriban, siempre debes responder en español de manera natural y fluida.`;

export default function Settings() {
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [enableGroupMessages, setEnableGroupMessages] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentPrompt();
  }, []);

  const loadCurrentPrompt = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setPrompt(data.customPrompt || DEFAULT_PROMPT);
        setEnableGroupMessages(data.enableGroupMessages === 'true');
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const savePrompt = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          customPrompt: prompt,
          enableGroupMessages: enableGroupMessages ? 'true' : 'false'
        }),
      });

      if (response.ok) {
        toast({
          title: "Configuración guardada",
          description: "La configuración ha sido actualizada exitosamente.",
        });
      } else {
        throw new Error("Error al guardar la configuración");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefault = () => {
    setPrompt(DEFAULT_PROMPT);
    setEnableGroupMessages(false);
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
            <SettingsIcon className="w-8 h-8" />
            Configuración
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Personaliza el comportamiento de la IA de WhatsApp
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              WhatsApp Groups
            </CardTitle>
            <CardDescription>
              Controla si la IA debe responder en grupos de WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="group-messages" className="text-base font-medium" data-testid="label-group-messages">
                  Responder en Grupos
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cuando está activado, la IA responderá a mensajes en grupos de WhatsApp
                </p>
              </div>
              <Switch
                id="group-messages"
                checked={enableGroupMessages}
                onCheckedChange={setEnableGroupMessages}
                data-testid="switch-group-messages"
              />
            </div>
          </CardContent>
        </Card>

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
                data-testid="textarea-prompt"
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
                data-testid="button-save-settings"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Guardando..." : "Guardar Configuración"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetToDefault}
                className="flex items-center gap-2"
                data-testid="button-reset-settings"
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
