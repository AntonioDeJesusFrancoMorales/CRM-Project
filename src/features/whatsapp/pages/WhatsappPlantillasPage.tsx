import { useState } from 'react';
import { FileText, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { usePlantillas, useCrearPlantilla, useEliminarPlantilla } from '../hooks/usePlantillas';

export function WhatsappPlantillasPage() {
  const { data: plantillas = [] } = usePlantillas();
  const crearMut = useCrearPlantilla();
  const eliminarMut = useEliminarPlantilla();
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');

  function handleCrear() {
    if (!titulo.trim() || !contenido.trim()) return;
    crearMut.mutate({ titulo: titulo.trim(), contenido: contenido.trim() }, {
      onSuccess: () => { setTitulo(''); setContenido(''); },
    });
  }

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Plantillas de mensaje</h1>
      </div>

      <Card className="p-4 space-y-3">
        <h2 className="font-medium text-sm">Nueva plantilla</h2>
        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Saludo inicial" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Contenido (usa {'{{nombre}}'} para el nombre del contacto)</Label>
          <Textarea value={contenido} onChange={(e) => setContenido(e.target.value)} rows={3} />
        </div>
        <Button size="sm" onClick={handleCrear} disabled={crearMut.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </Card>

      <div className="space-y-2">
        {plantillas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay plantillas todavía.</p>
        ) : (
          plantillas.map((p) => (
            <Card key={p.id} className="p-3 flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">{p.titulo}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{p.contenido}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => eliminarMut.mutate(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
