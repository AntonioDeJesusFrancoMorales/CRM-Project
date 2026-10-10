// useCreateTrato — POST /tratos/create con TratoCreatePayload.
// Sin XOR ni toggle: contactoId es un campo directo requerido.
//
// IMPORTANTE: el back AUTO-CREA una ficha TRATO al crear el trato
// (CreateTratoService.java). El front NO debe crear otra (duplicada) y SÍ debe
// invalidar ['fichas'] para que el Kanban muestre la ficha creada por el back.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Trato, TratoCreatePayload } from '@/api/types';
import { tratosKeys } from './useTratos';
import { fichasKeys } from '@/features/kanban/hooks/useFichas';

const inFlightTratoCreates = new Map<string, Promise<Trato>>();

function canonicalizeTratoCreatePayload(payload: TratoCreatePayload): string {
  return JSON.stringify({
    contactoId: payload.contactoId,
    responsableId: payload.responsableId,
    nombre: payload.nombre,
    valorEstimado: payload.valorEstimado ?? null,
    probabilidad: payload.probabilidad ?? null,
    fechaCierreEsperada: payload.fechaCierreEsperada ?? null,
    tipoContrato: payload.tipoContrato,
  });
}

function createTratoSingleFlight(payload: TratoCreatePayload): Promise<Trato> {
  const key = canonicalizeTratoCreatePayload(payload);
  const existingRequest = inFlightTratoCreates.get(key);
  if (existingRequest) return existingRequest;

  const request = apiClient.post<Trato>(endpoints.tratos.create(), payload);
  inFlightTratoCreates.set(key, request);

  // Remove both successful and failed requests, but never remove a newer request
  // that might have reused the same key after this one settled.
  void request.then(
    () => {
      if (inFlightTratoCreates.get(key) === request) inFlightTratoCreates.delete(key);
    },
    () => {
      if (inFlightTratoCreates.get(key) === request) inFlightTratoCreates.delete(key);
    },
  );

  return request;
}

export function useCreateTrato(): UseMutationResult<Trato, Error, TratoCreatePayload> {
  const queryClient = useQueryClient();

  return useMutation<Trato, Error, TratoCreatePayload>({
    mutationFn: createTratoSingleFlight,
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: tratosKeys.all });
      // El back creó la ficha asociada — refrescar el Kanban.
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
      toast.success(`Trato "${created.nombre}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422 || (error.status === 400 && error.details?.length)) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el trato');
      }
    },
  });
}
