
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Smartphone, QrCode, CheckCircle, XCircle } from "lucide-react";

interface WhatsAppStatus {
  isReady: boolean;
  isConnecting: boolean;
  hasQR: boolean;
}

export function WhatsAppPanel() {
  const [status, setStatus] = useState<WhatsAppStatus>({
    isReady: false,
    isConnecting: false,
    hasQR: false
  });
  const [qrCode, setQrCode] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/whatsapp/status");
      const data = await response.json();
      setStatus(data);

      if (data.hasQR && !data.isReady) {
        const qrResponse = await fetch("/api/whatsapp/qr");
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          setQrCode(qrData.qrCode);
        }
      } else if (data.isReady) {
        setQrCode("");
      }
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
    }
  };

  const initializeWhatsApp = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch("/api/whatsapp/initialize", {
        method: "POST",
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
        setStatus({ isReady: false, isConnecting: false, hasQR: false });
        setQrCode("");
      }
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const getStatusBadge = () => {
    if (status.isReady) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>;
    } else if (status.isConnecting) {
      return <Badge className="bg-yellow-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Conectando</Badge>;
    } else {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
    }
  };

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
          <Button 
            onClick={initializeWhatsApp} 
            disabled={isInitializing}
            className="w-full"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inicializando...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                Conectar WhatsApp
              </>
            )}
          </Button>
        )}

        {qrCode && (
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

        {status.isReady && (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ WhatsApp conectado exitosamente. La IA ahora responderá automáticamente a tus mensajes.
              </p>
            </div>
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
