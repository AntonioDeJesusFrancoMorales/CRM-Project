import { useState } from 'react';
import { Link } from 'react-router';
import { UserCheck, XCircle, RotateCcw, Bot, BotOff, Pencil, Check, X, TrendingUp, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LABEL_ESCALADO_HUMANO, type Conversacion, type EstadoRelacion, type Usuario } from '@/api/types';
import { useAuthStore } from '@/store/authStore';
import { useCreateTrato } from '@/features/tratos/hooks/useCreateTrato';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useContacto } from '@/features/contactos/hooks/useContacto';
import { useCambiarEstadoContacto } from '@/features/contactos/hooks/useCambiarEstadoContacto';
import { useAsignarAgente } from '../hooks/useAsignarAgente';
import { useCerrarConversacion } from '../hooks/useCerrarConversacion';
import { useReabrirConversacion } from '../hooks/useReabrirConversacion';
import { useAplicarLabelsConversacion } from '../hooks/useAplicarLabelsConversacion';
import { useRenombrarConversacion } from '../hooks/useRenombrarConversacion';

interface Props {
  conversacion: Conversacion;
  usuarios: Usuario[];
  empresaId: string;
}

function limpiarNumero(jid: string) {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '');
}

export function ConversacionHeader({ conversacion, usuarios, empresaId }: Props) {
  const asignarMut = useAsignarAgente();
  const cerrarMut = useCerrarConversacion();
  const reabrirMut = useReabrirConversacion();
  const labelsMut = useAplicarLabelsConversacion();
  const renombrarMut = useRenombrarConversacion();
  const crearTratoMut = useCreateTrato();
  const cambiarEstadoMut = useCambiarEstadoContacto();

  const usuarioId = useAuthStore((s) => s.usuario?.usuario_id);
  const { data: contacto } = useContacto(conversacion.contactoId ?? undefined);
  const { data: tratos = [] } = useTratos();
  const oportunidades = conversacion.contactoId
    ? tratos.filter((t) => t.contactoId === conversacion.contactoId)
    : [];

  const [editando, setEditando] = useState(false);
  const [nombreEdit, setNombreEdit] = useState('');

  const isCerrada = conversacion.estado === 'CERRADA';
  const botActivo = conversacion.botActivo;

  function handleCrearOportunidad() {
    if (!conversacion.contactoId || !usuarioId) return;
    crearTratoMut.mutate({
      contactoId: conversacion.contactoId,
      responsableId: usuarioId,
      nombre: conversacion.nombreContacto?.trim() || limpiarNumero(conversacion.numeroTelefono),
      valorEstimado: null,
      probabilidad: null,
      fechaCierreEsperada: null,
      tipoContrato: 'SERVICIO',
    });
  }

  function abrirEdicion() {
    setNombreEdit(conversacion.nombreContacto?.trim() || '');
    setEditando(true);
  }

  function guardarNombre() {
    const nuevo = nombreEdit.trim();
    if (!nuevo) return;
    renombrarMut.mutate(
      { conversacionId: conversacion.id, empresaId, nombre: nuevo },
      { onSuccess: () => setEditando(false) },
    );
  }

  function handleNombreKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      guardarNombre();
    } else if (e.key === 'Escape') {
      setEditando(false);
    }
  }

  function handleToggleBot() {
    const nuevasLabels = botActivo
      ? [LABEL_ESCALADO_HUMANO]
      : conversacion.labels.filter((l) => l !== LABEL_ESCALADO_HUMANO);
    labelsMut.mutate({ conversacionId: conversacion.id, empresaId, labels: nuevasLabels });
  }
  const numero = limpiarNumero(conversacion.numeroTelefono);
  const nombre = conversacion.nombreContacto?.trim();
  const titulo = !nombre || nombre === numero || /^\d+$/.test(nombre) ? `+${numero}` : nombre;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
          {titulo.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || '#'}
        </div>
        <div className="min-w-0">
          {editando ? (
            <div className="flex items-center gap-1">
              <Input
                autoFocus
                value={nombreEdit}
                onChange={(e) => setNombreEdit(e.target.value)}
                onKeyDown={handleNombreKeyDown}
                placeholder="Nombre del contacto"
                className="h-7 text-sm w-48"
                disabled={renombrarMut.isPending}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Guardar nombre"
                disabled={!nombreEdit.trim() || renombrarMut.isPending} onClick={guardarNombre}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Cancelar"
                disabled={renombrarMut.isPending} onClick={() => setEditando(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <p className="font-semibold text-sm truncate">{titulo}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                    aria-label="Renombrar contacto" onClick={abrirEdicion}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Renombrar contacto</TooltipContent>
              </Tooltip>
            </div>
          )}
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">+{numero}</p>
            {conversacion.csatScore != null && (
              <span className="text-[11px] text-amber-600 font-medium" title="Calificación del contacto (CSAT)">
                ⭐ {conversacion.csatScore}/5
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={botActivo ? 'outline' : 'secondary'}
              size="sm"
              className="h-8 text-xs"
              disabled={labelsMut.isPending}
              onClick={handleToggleBot}
            >
              {botActivo ? (
                <Bot className="h-3.5 w-3.5 mr-1 text-primary" />
              ) : (
                <BotOff className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              )}
              {botActivo ? 'Bot ON' : 'Bot OFF'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {botActivo
              ? 'Apagar el bot y ceder la conversación a un agente'
              : 'Reactivar el bot para esta conversación'}
          </TooltipContent>
        </Tooltip>

        {conversacion.contactoId && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs" disabled={!usuarioId}>
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  Oportunidades
                  {oportunidades.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                      {oportunidades.length}
                    </span>
                  )}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Oportunidades del contacto</DropdownMenuLabel>
                {oportunidades.length === 0 ? (
                  <DropdownMenuItem disabled>Sin oportunidades</DropdownMenuItem>
                ) : (
                  oportunidades.map((t) => (
                    <DropdownMenuItem key={t.id} asChild>
                      <Link to={`/tratos/${t.id}`} className="flex items-center justify-between gap-2">
                        <span className="truncate">{t.nombre}</span>
                        {t.estado === 'GANADO' && <Badge className="bg-emerald-600 text-white text-[10px] px-1.5">Ganado</Badge>}
                        {t.estado === 'PERDIDO' && <Badge variant="destructive" className="text-[10px] px-1.5">Perdido</Badge>}
                      </Link>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleCrearOportunidad} disabled={crearTratoMut.isPending}>
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Crear oportunidad rápida
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select
              value={contacto?.estadoRelacion ?? ''}
              onValueChange={(v) =>
                cambiarEstadoMut.mutate({ id: conversacion.contactoId!, nuevoEstado: v as EstadoRelacion })
              }
            >
              <SelectTrigger className="w-32 h-8 text-xs" aria-label="Estado del contacto">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROSPECTO" className="text-xs">Prospecto</SelectItem>
                <SelectItem value="ACTIVO" className="text-xs">Cliente</SelectItem>
                <SelectItem value="INACTIVO" className="text-xs">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}

        {isCerrada && (
          <>
            <Badge variant="secondary">Cerrada</Badge>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={reabrirMut.isPending}
              onClick={() => reabrirMut.mutate({ conversacionId: conversacion.id, empresaId })}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reabrir
            </Button>
          </>
        )}

        {!isCerrada && (
          <>
            <Select
              value={conversacion.asignadoA ?? ''}
              onValueChange={(agenteId) =>
                asignarMut.mutate({ conversacionId: conversacion.id, agenteId, empresaId })
              }
            >
              <SelectTrigger className="w-40 h-8 text-xs" aria-label="Asignar agente">
                <UserCheck className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Asignar agente" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={cerrarMut.isPending}
              onClick={() => cerrarMut.mutate({ conversacionId: conversacion.id, empresaId })}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Cerrar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
