import { describe, expect, it } from 'vitest';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import { contactosFixture } from '@/mocks/fixtures/contactos';
import { usuariosFixture } from '@/mocks/fixtures/usuarios';
import { createTratosCsv } from '../lib/dashboardCsv';

const usuarios = usuariosFixture.map(({ password: _password, rol_sistema: _rs, rol_empresa: _re, ...usuario }) => usuario);

describe('dashboardCsv', () => {
  it('crea CSV de tratos con encabezado y valores escapados', () => {
    const csv = createTratosCsv(tratosFixture.slice(0, 1), contactosFixture, usuarios);

    expect(csv).toContain('Nombre,Contacto,Responsable,Valor,Probabilidad,Tipo,Creado');
    expect(csv).toContain('"Implementación CRM Innovatech"');
    expect(csv).toContain('"María González"');
  });
});
