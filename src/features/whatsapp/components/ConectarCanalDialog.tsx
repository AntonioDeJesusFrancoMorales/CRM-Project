import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, WifiOff, RefreshCw, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useConectarCanal } from '../hooks/useConectarCanal';
import { useEstadoCanal } from '../hooks/useEstadoCanal';
import { useSyncChats } from '../hooks/useSyncChats';
import { useQueryClient } from '@tanstack/react-query';
import { canalesKeys } from '../hooks/useCanales';

interface Props {
  open: boolean;
  onClose: () => void;
  canalId: string;
  canalNombre: string;
}

const PASOS = [
  'Abre WhatsApp en tu celular',
  'Toca los 3 puntos (⋮) → Dispositivos vinculados',
  'Toca "Vincular un dispositivo"',
  'Escanea este código QR',
];

export function ConectarCanalDialog({ open, onClose, canalId, canalNombre }: Props) {
  const queryClient = useQueryClient();
  const conectarMut = useConectarCanal();
  const syncMut = useSyncChats();
  const [segundos, setSegundos] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  const { data: estadoData } = useEstadoCanal(
    canalId,
    open && !!conectarMut.data,
  );

  const estadoActual = estadoData?.estado ?? conectarMut.data?.estado;
  const qrBase64 = conectarMut.data?.qrBase64;
  const conectado = estadoActual === 'ACTIVO';

  // Lanzar conexión automáticamente al abrir
  useEffect(() => {
    if (open && !conectarMut.data && !conectarMut.isPending) {
      conectarMut.mutate(canalId);
      setSegundos(0);
    }
  }, [open, canalId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Contador para indicar expiración del QR
  useEffect(() => {
    if (!qrBase64 || conectado) return;
    const interval = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [qrBase64, conectado]);

  // Al conectar: sincronizar historial y cerrar
  useEffect(() => {
    if (conectado && !sincronizando) {
      setSincronizando(true);
      void queryClient.invalidateQueries({ queryKey: canalesKeys.all });
      syncMut.mutate(canalId, {
        onSettled: () => {
          setTimeout(onClose, 2000);
        },
      });
    }
  }, [conectado]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    conectarMut.reset();
    setSincronizando(false);
    setSegundos(0);
    onClose();
  }

  function handleRegenerar() {
    conectarMut.reset();
    setSegundos(0);
    conectarMut.mutate(canalId);
  }

  const qrExpirado = segundos >= 30;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp — {canalNombre}</DialogTitle>
          <DialogDescription>
            Sigue los pasos para vincular tu número de WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5">

          {/* Cargando QR */}
          {(conectarMut.isPending || (!qrBase64 && !conectado && !conectarMut.isError)) && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Generando código QR...</p>
            </div>
          )}

          {/* QR disponible */}
          {qrBase64 && !conectado && (
            <>
              <ol className="w-full space-y-1 text-sm text-muted-foreground list-none">
                {PASOS.map((paso, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span>{paso}</span>
                  </li>
                ))}
              </ol>

              <div className="relative">
                <img
                  src={qrBase64}
                  alt="Código QR de WhatsApp"
                  className={`w-72 h-72 rounded-xl border-2 border-border transition-opacity ${qrExpirado ? 'opacity-30' : 'opacity-100'}`}
                />
                {qrExpirado && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium text-foreground">QR expirado</p>
                    <Button size="sm" variant="outline" onClick={handleRegenerar}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Generar nuevo
                    </Button>
                  </div>
                )}
              </div>

              {!qrExpirado && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Esperando escaneo... (expira en {30 - segundos}s)</span>
                </div>
              )}
            </>
          )}

          {/* Conectado — cargando historial */}
          {conectado && (
            <div className="flex flex-col items-center gap-3 py-10">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-lg font-semibold text-green-600">¡WhatsApp conectado!</p>
              {syncMut.isPending ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando historial de conversaciones...</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Cerrando automáticamente...</p>
              )}
            </div>
          )}

          {/* Error */}
          {conectarMut.isError && (
            <div className="flex flex-col items-center gap-3 py-8">
              <WifiOff className="h-10 w-10 text-destructive" />
              <p className="text-sm text-destructive text-center font-medium">
                No se pudo conectar con Evolution API
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Verifica que EVOLUTION_API_URL y EVOLUTION_API_KEY estén configurados en el servidor.
              </p>
              <Button size="sm" variant="outline" onClick={handleRegenerar}>
                <RefreshCw className="h-4 w-4 mr-1" /> Reintentar
              </Button>
            </div>
          )}

          {qrBase64 && !conectado && !qrExpirado && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              El QR solo puede escanearse una vez.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
