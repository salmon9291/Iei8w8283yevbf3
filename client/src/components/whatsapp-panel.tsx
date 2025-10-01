
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Smartphone, QrCode, CheckCircle, XCircle, Key, Settings, Lock } from "lucide-react";
import { Link } from "wouter";

interface WhatsAppStatus {
  isReady: boolean;
  isConnecting: boolean;
  hasQR: boolean;
  hasPairingCode: boolean;
  usePairingCode: boolean;
}

const ADMIN_PASSWORD = "SWzv95VBf6";

export function WhatsAppPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [status, setStatus] = useState<WhatsAppStatus>({
    isReady: false,
    isConnecting: false,
    hasQR: false,
    hasPairingCode: false,
    usePairingCode: false
  });
  const [qrCode, setQrCode] = useState<string>("");
  const [pairingCode, setPairingCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [usePairingMethod, setUsePairingMethod] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/whatsapp/status");
      const data = await response.json();
      setStatus(data);

      if (data.hasQR && !data.isReady && !data.usePairingCode) {
        const qrResponse = await fetch("/api/whatsapp/qr");
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          setQrCode(qrData.qrCode);
        }
      } else if (data.hasPairingCode && !data.isReady && data.usePairingCode) {
        const pairingResponse = await fetch("/api/whatsapp/pairing-code");
        if (pairingResponse.ok) {
          const pairingData = await pairingResponse.json();
          setPairingCode(pairingData.pairingCode);
        }
      } else if (data.isReady) {
        setQrCode("");
        setPairingCode("");
      }
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
    }
  };

  const initializeWhatsApp = async () => {
    if (usePairingMethod && !phoneNumber) {
      alert("Por favor ingresa tu número de teléfono para usar el código de emparejamiento");
      return;
    }

    setIsInitializing(true);
    try {
      const response = await fetch("/api/whatsapp/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usePairingCode: usePairingMethod,
          phoneNumber: usePairingMethod ? phoneNumber : undefined,
        }),
      });
      
      if (response.ok) {
        // Empezar a verificar el estado cada 2 segundos
        const interval = setInterval(checkStatus, 2000);
        
        // Limpiar el intervalo cuando se conecte
        const checkConnection = setInterval(() => {
          if (status.isReady) {
            clearInterval(interval);
            clearInterval(checkConnection);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error initializing WhatsApp:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const disconnectWhatsApp = async () => {
    try {
      const response = await fetch("/api/whatsapp/disconnect", {
        method: "POST",
      });
      
      if (response.ok) {
        setStatus({ isReady: false, isConnecting: false, hasQR: false, hasPairingCode: false, usePairingCode: false });
        setQrCode("");
        setPairingCode("");
        setPhoneNumber("");
        setUsePairingMethod(false);
      }
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
    }
  };

  useEffect(() => {
    // Check if already authenticated in session
    const authStatus = sessionStorage.getItem('whatsapp_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      checkStatus();
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('whatsapp_admin_auth', 'true');
      setPasswordError("");
      setPasswordInput("");
    } else {
      setPasswordError("Contraseña incorrecta");
    }
  };

  const getStatusBadge = () => {
    if (status.isReady) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>;
    } else if (status.isConnecting) {
      return <Badge className="bg-yellow-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Conectando</Badge>;
    } else {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
    }
  };

  // Show password screen if not authenticated
  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Acceso Administrativo
          </CardTitle>
          <CardDescription>
            Ingresa la contraseña para acceder al panel de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Contraseña de Administrador</Label>
              <Input
                id="admin-password"
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError("");
                }}
                placeholder="Ingresa la contraseña"
                data-testid="input-admin-password"
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={!passwordInput}
              data-testid="button-admin-login"
            >
              Acceder
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          WhatsApp Auto-Respuesta
        </CardTitle>
        <CardDescription>
          Conecta tu WhatsApp para que la IA responda automáticamente
        </CardDescription>
        <div className="flex justify-between items-center">
          <span className="text-sm">Estado:</span>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!status.isReady && !status.isConnecting && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="pairing-method"
                checked={usePairingMethod}
                onCheckedChange={setUsePairingMethod}
              />
              <Label htmlFor="pairing-method">
                Usar código de emparejamiento en lugar de QR
              </Label>
            </div>

            {usePairingMethod && (
              <div className="space-y-2">
                <Label htmlFor="phone">Número de teléfono (con código de país)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Ejemplo: +521234567890 (incluye el código de país)
                </p>
              </div>
            )}

            <Button 
              onClick={initializeWhatsApp} 
              disabled={isInitializing || (usePairingMethod && !phoneNumber)}
              className="w-full"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inicializando...
                </>
              ) : (
                <>
                  {usePairingMethod ? (
                    <Key className="w-4 h-4 mr-2" />
                  ) : (
                    <QrCode className="w-4 h-4 mr-2" />
                  )}
                  Conectar WhatsApp
                </>
              )}
            </Button>
          </div>
        )}

        {qrCode && !status.usePairingCode && (
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Escanea este código QR con tu WhatsApp:
            </p>
            <div className="flex justify-center">
              <img 
                src={qrCode} 
                alt="WhatsApp QR Code" 
                className="max-w-full h-auto border rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-500">
              Abre WhatsApp → Menú → Dispositivos vinculados → Vincular dispositivo
            </p>
          </div>
        )}

        {pairingCode && status.usePairingCode && (
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Ingresa este código en tu WhatsApp:
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-2xl font-mono font-bold text-blue-800 tracking-widest">
                {pairingCode}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Abre WhatsApp → Menú → Dispositivos vinculados → Vincular dispositivo → Vincular con número de teléfono
            </p>
          </div>
        )}

        {status.isReady && (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ WhatsApp conectado exitosamente. La IA ahora responderá automáticamente a tus mensajes.
              </p>
            </div>
            <Link href="/settings">
              <Button 
                variant="secondary"
                className="w-full mb-2"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar IA
              </Button>
            </Link>
            <Button 
              onClick={disconnectWhatsApp} 
              variant="outline"
              className="w-full"
            >
              Desconectar WhatsApp
            </Button>
          </div>
        )}

        {status.isConnecting && !qrCode && (
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
            <p className="text-sm text-gray-600 mt-2">
              Preparando conexión...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
