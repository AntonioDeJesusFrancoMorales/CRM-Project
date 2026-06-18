import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

interface AjustesWa {
  autoAsignar: boolean;
  bienvenidaActiva: boolean;
  bienvenidaTexto: string;
  horarioActivo: boolean;
  horarioInicio: string;
  horarioFin: string;
  horarioDias: string;
  fueraHorarioTexto: string;
  csatActivo: boolean;
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      {label}
    </label>
  );
}

export function WhatsappAjustesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<AjustesWa>({
    queryKey: ['wa-ajustes'],
    queryFn: () => apiClient.get<AjustesWa>(endpoints.wa.ajustes()),
  });
  const [form, setForm] = useState<AjustesWa | null>(null);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const saveMut = useMutation({
    mutationFn: (payload: AjustesWa) => apiClient.put<AjustesWa>(endpoints.wa.ajustes(), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wa-ajustes'] });
      toast.success('Ajustes guardados');
    },
    onError: () => toast.error('No se pudieron guardar los ajustes'),
  });

  if (isLoading || !form) {
    return <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const set = <K extends keyof AjustesWa>(k: K, v: AjustesWa[K]) => setForm({ ...form, [k]: v });

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Ajustes de WhatsApp</h1>
      </div>

      <Card className="p-4 space-y-3">
        <h2 className="font-medium text-sm">Asignación</h2>
        <Check checked={form.autoAsignar} onChange={(v) => set('autoAsignar', v)}
          label="Auto-asignar conversaciones nuevas al agente con menos carga" />
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-medium text-sm">Bienvenida automática</h2>
        <Check checked={form.bienvenidaActiva} onChange={(v) => set('bienvenidaActiva', v)}
          label="Enviar mensaje de bienvenida en el primer contacto" />
        <div className="space-y-1">
          <Label className="text-xs">Texto (usa {'{{nombre}}'} para el nombre del contacto)</Label>
          <Textarea value={form.bienvenidaTexto ?? ''} onChange={(e) => set('bienvenidaTexto', e.target.value)} rows={2} />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-medium text-sm">Horario de atención</h2>
        <Check checked={form.horarioActivo} onChange={(v) => set('horarioActivo', v)}
          label="Responder autocontestador fuera de horario" />
        <div className="flex gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Inicio</Label>
            <Input value={form.horarioInicio ?? ''} onChange={(e) => set('horarioInicio', e.target.value)} className="w-24" placeholder="09:00" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fin</Label>
            <Input value={form.horarioFin ?? ''} onChange={(e) => set('horarioFin', e.target.value)} className="w-24" placeholder="18:00" />
          </div>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">Días (1=Lun … 7=Dom)</Label>
            <Input value={form.horarioDias ?? ''} onChange={(e) => set('horarioDias', e.target.value)} placeholder="1,2,3,4,5" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mensaje fuera de horario</Label>
          <Textarea value={form.fueraHorarioTexto ?? ''} onChange={(e) => set('fueraHorarioTexto', e.target.value)} rows={2} />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-medium text-sm">Encuesta de satisfacción (CSAT)</h2>
        <Check checked={form.csatActivo} onChange={(v) => set('csatActivo', v)}
          label="Pedir calificación 1-5 al cerrar la conversación" />
      </Card>

      <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
        {saveMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
        Guardar ajustes
      </Button>
    </div>
  );
}
