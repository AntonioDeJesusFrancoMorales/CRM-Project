// ADR-042 — useCreateTrato transforma el input del form antes de POST:
// elimina `asociacion`, fuerza el campo opuesto al toggle a `null`,
// y normaliza strings vacíos a null para campos opcionales.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import type { Trato } from '@/api/types';
import type { TratoCreateInput } from '../schemas/trato.schema';
import { tratosKeys } from './useTratos';

interface TratoCreatePayload {
  cliente_id: string | null;
  prospecto_id: string | null;
  nombre: string;
  responsable_id: string;
  valor_estimado: number | null;
  probabilidad: number | null;
  fecha_cierre_esperada: string | null;
  tipo_contrato: 'precio_fijo' | 'tiempo_materiales' | 'retainer' | null;
}

function toPayload(input: TratoCreateInput): TratoCreatePayload {
  const isCliente = input.asociacion === 'cliente';
  const fechaCierre = input.fecha_cierre_esperada?.trim();
  return {
    cliente_id: isCliente ? (input.cliente_id ?? '') || null : null,
    prospecto_id: !isCliente ? (input.prospecto_id ?? '') || null : null,
    nombre: input.nombre,
    responsable_id: input.responsable_id,
    valor_estimado: input.valor_estimado ?? null,
    probabilidad: input.probabilidad ?? null,
    fecha_cierre_esperada: fechaCierre ? fechaCierre : null,
    tipo_contrato: input.tipo_contrato ?? null,
  };
}

export function useCreateTrato(): UseMutationResult<Trato, Error, TratoCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Trato, Error, TratoCreateInput>({
    mutationFn: (input) => apiClient.post<Trato>('/tratos', toPayload(input)),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: tratosKeys.all });
      toast.success(`Trato "${created.nombre}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el trato');
      }
    },
  });
}
