
import { WhatsAppPanel } from "@/components/whatsapp-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, MessageSquare, Key, Users, Trash2, Send } from "lucide-react";
import React, { useState, useEffect } from "react";

type SettingsType = {
  enableGroupMessages: boolean;
  customPrompt: string | null;
  geminiApiKey: string | null;
  restrictedNumbers: string | null;
  restrictedPrompt: string | null;
};

export default function WhatsAppAdmin() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsType>({
    enableGroupMessages: false,
    customPrompt: null,
    geminiApiKey: null,
    restrictedNumbers: null,
    restrictedPrompt: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // Estado para envío de mensajes
  const [selectedNumber, setSelectedNumber] = useState("");
  const [messageToSend, setMessageToSend] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) throw new Error("Error fetching settings");
        const data: SettingsType = await response.json();
        setSettings(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar las configuraciones",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enableGroupMessages: settings.enableGroupMessages,
          customPrompt: settings.customPrompt || null,
          geminiApiKey: settings.geminiApiKey || null,
          restrictedNumbers: settings.restrictedNumbers || null,
          restrictedPrompt: settings.restrictedPrompt || null,
        }),
      });

      if (!response.ok) throw new Error("Error al guardar la configuración");

      toast({
        title: "Configuración guardada",
        description: "Los cambios se han aplicado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllMessages = async () => {
    if (!confirm("¿Estás seguro de que deseas borrar TODA la memoria de mensajes? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await fetch("/api/messages/clear-all", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Error al limpiar mensajes");

      toast({
        title: "Memoria limpiada",
        description: "Todos los mensajes han sido eliminados exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo limpiar la memoria",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedNumber.trim() || !messageToSend.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa el número y el mensaje",
        variant: "destructive",
      });
      return;
    }

    setIsSendingMessage(true);

    try {
      const response = await fetch("/api/whatsapp/send-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: selectedNumber,
          message: messageToSend,
          saveToHistory: true,
        }),
      });

      if (!response.ok) throw new Error("Error al enviar mensaje");

      toast({
        title: "✓ Mensaje enviado",
        description: `Mensaje enviado a ${selectedNumber}`,
      });

      setMessageToSend("");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-2xl space-y-6">
        {/* Tarjeta de Envío de Mensajes - Estilo WhatsApp */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-green-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Enviar Mensaje Manual
            </CardTitle>
            <CardDescription className="text-green-50">
              Envía mensajes directamente como si fuera WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Número de WhatsApp
                </Label>
                <Input
                  id="phoneNumber"
                  type="text"
                  value={selectedNumber}
                  onChange={(e) => setSelectedNumber(e.target.value)}
                  placeholder="whatsapp_5213532310801"
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                <p className="text-xs text-muted-foreground">
                  Ejemplo: whatsapp_5213532310801 (formato del username)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="messageContent" className="text-sm font-medium">
                  Mensaje
                </Label>
                <Textarea
                  id="messageContent"
                  value={messageToSend}
                  onChange={(e) => setMessageToSend(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  className="min-h-[120px] border-gray-300 focus:border-green-500 focus:ring-green-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Presiona Enter para enviar o Shift+Enter para nueva línea
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isSendingMessage || !selectedNumber.trim() || !messageToSend.trim()}
              >
                {isSendingMessage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensaje
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <CardDescription>
              Ajusta el comportamiento general del bot de WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableGroupMessages"
                  checked={settings.enableGroupMessages}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableGroupMessages: checked })
                  }
                />
                <Label htmlFor="enableGroupMessages">
                  Habilitar Mensajes Grupales
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customPrompt">Prompt Personalizado General</Label>
                <Textarea
                  id="customPrompt"
                  value={settings.customPrompt || ""}
                  onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                  placeholder="Eres un asistente útil..."
                  className="min-h-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  Este prompt se usará como base para todas las interacciones
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geminiApiKey">API Key de Gemini</Label>
                <Input
                  id="geminiApiKey"
                  type="password"
                  value={settings.geminiApiKey || ""}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  placeholder="sk-..."
                />
                <p className="text-sm text-muted-foreground">
                  Tu clave API de Google Gemini. Se mantendrá en secreto.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restrictedNumbers">
                  Números Restringidos (separados por coma)
                </Label>
                <Input
                  id="restrictedNumbers"
                  value={settings.restrictedNumbers || ""}
                  onChange={(e) => setSettings({ ...settings, restrictedNumbers: e.target.value })}
                  placeholder="521234567890,521987654321"
                />
                <p className="text-sm text-muted-foreground">
                  Ejemplo: 5213532310802,5219876543210
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restrictedPrompt">
                  Prompt Personalizado para Números Restringidos
                </Label>
                <Textarea
                  id="restrictedPrompt"
                  value={settings.restrictedPrompt || ""}
                  onChange={(e) => setSettings({ ...settings, restrictedPrompt: e.target.value })}
                  placeholder="Instrucciones especiales para estos números..."
                  className="min-h-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  Este prompt se usará solo para los números en la lista de restringidos
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar Configuración
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Limpieza de Memoria
            </CardTitle>
            <CardDescription>
              Eliminar todos los mensajes almacenados del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta acción eliminará permanentemente todos los mensajes de todas las conversaciones.
              El bot comenzará desde cero sin historial previo.
            </p>
            <Button
              variant="destructive"
              onClick={handleClearAllMessages}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Toda la Memoria
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conexión de WhatsApp
            </CardTitle>
            <CardDescription>
              Conecta o desconecta tu cuenta de WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WhatsAppPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
