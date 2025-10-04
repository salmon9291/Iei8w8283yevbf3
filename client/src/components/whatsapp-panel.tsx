import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Settings, 
  Power, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Users,
  Key,
  Save,
  RefreshCw
} from "lucide-react";

const DEFAULT_PROMPT = `Eres un asistente de IA que SIEMPRE responde en español. Tu nombre es Asistente y te diriges al usuario como "{username}". Siempre menciona su nombre al menos una vez en cada respuesta de manera natural y amigable. Sin importar el idioma en que te escriban, siempre debes responder en español de manera natural y fluida.`;

export function WhatsAppPanel() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);
  const [enableGroupMessages, setEnableGroupMessages] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
    loadSettings();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/whatsapp/status");
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
      }
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setCustomPrompt(data.customPrompt || DEFAULT_PROMPT);
        setEnableGroupMessages(data.enableGroupMessages === 'true');
        setGeminiApiKey(data.geminiApiKey || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/whatsapp/connect", { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        if (data.qr) {
          setQrCode(data.qr);
        }
        pollForConnection();
      }
    } catch (error) {
      console.error("Error connecting:", error);
      toast({
        title: "Error de Conexión",
        description: "No se pudo iniciar la conexión con WhatsApp.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/whatsapp/disconnect", { method: "POST" });
      if (response.ok) {
        setIsConnected(false);
        setQrCode("");
        toast({
          title: "Desconectado",
          description: "WhatsApp se ha desconectado correctamente.",
        });
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast({
        title: "Error",
        description: "No se pudo desconectar WhatsApp.",
        variant: "destructive",
      });
    }
  };

  const pollForConnection = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/whatsapp/status");
        if (response.ok) {
          const data = await response.json();
          if (data.connected) {
            setIsConnected(true);
            setIsConnecting(false);
            setQrCode("");
            clearInterval(interval);
            toast({
              title: "Conexión Exitosa",
              description: "WhatsApp se ha conectado correctamente.",
            });
          }
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(interval);
      setIsConnecting(false);
    }, 60000);
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customPrompt,
          enableGroupMessages: enableGroupMessages ? 'true' : 'false',
          geminiApiKey: geminiApiKey.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: "Guardado Exitoso",
          description: "La configuración se ha actualizado correctamente.",
        });
      } else {
        throw new Error("Error al guardar");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetPrompt = () => {
    setCustomPrompt(DEFAULT_PROMPT);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-gray-900" />
            Panel de Administración WhatsApp
          </h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Conectado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Desconectado</span>
              </div>
            )}
          </div>
        </div>
        <p className="text-gray-600">
          Gestiona la conexión de WhatsApp y configura el comportamiento del asistente de IA
        </p>
      </div>

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg mb-6">
          <TabsTrigger 
            value="connection" 
            className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-700 font-medium"
          >
            <Power className="w-4 h-4 mr-2" />
            Conexión
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="data-[state=active]:bg-gray-900 data-[state=active]:text-white text-gray-700 font-medium"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-gray-900">Estado de Conexión</CardTitle>
              <CardDescription className="text-gray-600">
                Conecta o desconecta tu cuenta de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {!isConnected && !isConnecting && (
                  <Button
                    onClick={handleConnect}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-6 text-lg"
                    size="lg"
                  >
                    <Power className="w-5 h-5 mr-2" />
                    Conectar WhatsApp
                  </Button>
                )}

                {isConnecting && qrCode && (
                  <div className="space-y-4">
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                        Escanea el código QR
                      </h3>
                      <div className="flex justify-center mb-4">
                        <img
                          src={qrCode}
                          alt="QR Code"
                          className="w-64 h-64 border-4 border-gray-900 rounded-lg"
                        />
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        Abre WhatsApp en tu teléfono y escanea este código
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Esperando conexión...</span>
                    </div>
                  </div>
                )}

                {isConnected && (
                  <div className="space-y-4">
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 className="w-6 h-6 text-gray-900" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          WhatsApp Conectado
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Tu bot está activo y respondiendo mensajes
                      </p>
                    </div>
                    <Button
                      onClick={handleDisconnect}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 font-medium py-6 text-lg"
                      size="lg"
                    >
                      <Power className="w-5 h-5 mr-2" />
                      Desconectar WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Key de Gemini
              </CardTitle>
              <CardDescription className="text-gray-600">
                Configura tu clave API personalizada de Google Gemini
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiKey" className="text-gray-700 font-medium">
                    Gemini API Key
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="mt-2 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Opcional. Si no se proporciona, se usará la clave por defecto del sistema
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Configuración de Grupos
              </CardTitle>
              <CardDescription className="text-gray-600">
                Controla el comportamiento del bot en grupos de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-1">
                  <Label htmlFor="group-messages" className="text-base font-medium text-gray-900">
                    Responder en Grupos
                  </Label>
                  <p className="text-sm text-gray-600">
                    Permite que el bot responda mensajes en grupos
                  </p>
                </div>
                <Switch
                  id="group-messages"
                  checked={enableGroupMessages}
                  onCheckedChange={setEnableGroupMessages}
                  className="data-[state=checked]:bg-gray-900"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Prompt del Sistema
              </CardTitle>
              <CardDescription className="text-gray-600">
                Define el comportamiento y personalidad del asistente de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-gray-700 font-medium">
                    Instrucciones del Sistema
                  </Label>
                  <Textarea
                    id="prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Define cómo debe comportarse la IA..."
                    className="mt-2 min-h-[180px] border-gray-300 focus:border-gray-900 focus:ring-gray-900 resize-y"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Usa {"{username}"} donde quieras que aparezca el nombre del usuario
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={resetPrompt}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restaurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-8 py-6 text-lg"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}