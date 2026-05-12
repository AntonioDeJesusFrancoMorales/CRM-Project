import type { Cliente } from '@/api/types';

export const clientesFixture: Cliente[] = [
  {
    id: 'c1111111-cccc-1111-cccc-111111111111',
    empresa_id: 'a1111111-aaaa-1111-aaaa-111111111111',
    responsable_id: '22222222-2222-2222-2222-222222222222',
    creado_por: '11111111-1111-1111-1111-111111111111',
    nombre_contacto: 'Ana Rodríguez',
    correo_contacto: 'ana.rodriguez@innovatech.example.com',
    telefono_contacto: '+52 961 555 1001',
    cargo_contacto: 'Compras',
    como_nos_conocio: 'evento',
    notas: 'Cliente activo desde marzo. Revisar renovación en septiembre.',
    creado_en: '2026-03-10T10:00:00.000Z',
    actualizado_en: '2026-04-25T11:00:00.000Z',
  },
  {
    id: 'c2222222-cccc-2222-cccc-222222222222',
    empresa_id: 'a2222222-aaaa-2222-aaaa-222222222222',
    responsable_id: '22222222-2222-2222-2222-222222222222',
    creado_por: '11111111-1111-1111-1111-111111111111',
    nombre_contacto: 'Diego Vargas',
    correo_contacto: 'dvargas@corpmaya.example.com',
    telefono_contacto: '+52 961 555 1002',
    cargo_contacto: 'CEO',
    como_nos_conocio: 'referido',
    notas: null,
    creado_en: '2026-02-18T09:00:00.000Z',
    actualizado_en: '2026-05-01T13:20:00.000Z',
  },
];
