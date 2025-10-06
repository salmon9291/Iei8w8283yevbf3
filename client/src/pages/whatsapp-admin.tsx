
import { WhatsAppPanel } from "@/components/whatsapp-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, MessageSquare, Key, Users, Trash2, Send, Lock } from "lucide-react";
import React, { useState, useEffect } from "react";

type SettingsType = {
  enableGroupMessages: boolean;
  customPrompt: string | null;
  geminiApiKey: string | null;
  restrictedNumbers: string | null;
  restrictedPrompt: string | null;
  adminPassword: string | null;
};

export default function WhatsAppAdmin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [settings, setSettings] = useState<SettingsType>({
    enableGroupMessages: false,
    customPrompt: null,
    geminiApiKey: null,
    restrictedNumbers: null,
    restrictedPrompt: null,
    adminPassword: null,
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Error al verificar contraseña");
      
      const data: SettingsType = await response.json();
      
      // Si no hay contraseña configurada, usar contraseña por defecto "admin"
      const storedPassword = data.adminPassword || "admin";
      
      if (password === storedPassword) {
        setIsAuthenticated(true);
        toast({
          title: "Acceso concedido",
          description: "Bienvenido al panel de administración",
        });
      } else {
        toast({
          title: "Acceso denegado",
          description: "Contraseña incorrecta",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo verificar la contraseña",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

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
          adminPassword: settings.adminPassword || null,
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0E1525]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F26430]" />
      </div>
    );
  }

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0E1525]">
        <Card className="w-full max-w-md bg-[#1C2333] border-[#2E3A52]">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#F26430] to-[#569CD6] rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-[#F5F9FC]">Panel de Administración</CardTitle>
            <CardDescription className="text-[#9BA4B5]">
              Ingresa tu contraseña para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#F5F9FC]">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="bg-[#2E3A52] border-[#2E3A52] text-[#F5F9FC] focus:border-[#F26430] focus:ring-[#F26430]"
                  autoFocus
                />
                <p className="text-xs text-[#9BA4B5]">
                  Contraseña por defecto: <code className="bg-[#2E3A52] px-1 rounded">SWzv95VBf6</code>
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#F26430] hover:bg-[#D5562A] text-white"
                disabled={isAuthenticating || !password.trim()}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Ingresar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0E1525]">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="bg-[#1C2333] border-[#2E3A52]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F5F9FC]">
              <Settings className="h-5 w-5 text-[#F26430]" />
              Configuración General
            </CardTitle>
            <CardDescription className="text-[#9BA4B5]">
              Ajusta el comportamiento del bot de WhatsApp
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
                  className="data-[state=checked]:bg-[#F26430]"
                />
                <Label htmlFor="enableGroupMessages" className="text-[#F5F9FC]">
                  Habilitar respuestas en grupos
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geminiApiKey" className="text-[#F5F9FC]">API Key de Gemini</Label>
                <Input
                  id="geminiApiKey"
                  type="password"
                  value={settings.geminiApiKey || ""}
                  onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                  placeholder="AIza..."
                  className="bg-[#2E3A52] border-[#2E3A52] text-[#F5F9FC] focus:border-[#F26430] focus:ring-[#F26430]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customPrompt" className="text-[#F5F9FC]">Prompt del Sistema</Label>
                <Textarea
                  id="customPrompt"
                  value={settings.customPrompt || ""}
                  onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                  placeholder="Eres un asistente útil..."
                  className="min-h-[100px] bg-[#2E3A52] border-[#2E3A52] text-[#F5F9FC] focus:border-[#F26430] focus:ring-[#F26430]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword" className="text-[#F5F9FC]">Contraseña del Admin</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={settings.adminPassword || ""}
                  onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                  placeholder="Cambiar contraseña..."
                  className="bg-[#2E3A52] border-[#2E3A52] text-[#F5F9FC] focus:border-[#F26430] focus:ring-[#F26430]"
                />
              </div>

              <Button type="submit" className="w-full bg-[#F26430] hover:bg-[#D5562A] text-white" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar Configuración
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-[#1C2333] border-[#2E3A52]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#F5F9FC]">
              <MessageSquare className="h-5 w-5 text-[#569CD6]" />
              Conexión WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WhatsAppPanel />
          </CardContent>
        </Card>

        <Card className="bg-[#1C2333] border-[#E06C75]/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#E06C75]">
              <Trash2 className="h-5 w-5" />
              Limpieza de Memoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleClearAllMessages}
              className="w-full bg-[#E06C75] hover:bg-[#C05566]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Toda la Memoria
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
