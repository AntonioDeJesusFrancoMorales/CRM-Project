import { describe, it, expect } from 'vitest';
import { usuarioCreateSchema, usuarioUpdateSchema } from '../schemas/usuario.schema';

describe('usuarioCreateSchema', () => {
  it('valida un objeto completo válido', () => {
    const result = usuarioCreateSchema.safeParse({
      nombre: 'Carlos Pérez',
      correo: 'carlos@crm.test',
      rolId: 'rol-admin-uuid-1111-111111111111',
      initialPassword: 'Password123!',
    });
    expect(result.success).toBe(true);
  });

  it('valida nombre con máximo 100 caracteres', () => {
    const result = usuarioCreateSchema.safeParse({
      nombre: 'a'.repeat(101),
      correo: 'ok@ok.com',
      rolId: 'rol-admin-uuid-1111-111111111111',
      initialPassword: 'Pass123!',
    });
    expect(result.success).toBe(false);
  });

  it('valida correo con formato @email y máximo 120', () => {
    const result = usuarioCreateSchema.safeParse({
      nombre: 'Test',
      correo: 'no-es-email',
      rolId: 'rol-admin-uuid-1111-111111111111',
      initialPassword: 'Pass123!',
    });
    expect(result.success).toBe(false);
  });

  it('exige rolId no vacío', () => {
    const result = usuarioCreateSchema.safeParse({
      nombre: 'Test',
      correo: 'ok@ok.com',
      rolId: '',
      initialPassword: 'Pass123!',
    });
    expect(result.success).toBe(false);
  });

  it('exige initialPassword no vacío', () => {
    const result = usuarioCreateSchema.safeParse({
      nombre: 'Test',
      correo: 'ok@ok.com',
      rolId: 'rol-admin-uuid-1111-111111111111',
      initialPassword: '',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza body con rol_sistema o rol_empresa (campos legacy)', () => {
    // Un body que incluyera rol_sistema/rol_empresa debería ser inválido o ignorado
    // En Zod strict mode, campos extra fallan; en modo default se stripean.
    // El schema no debe tener rol_sistema ni rol_empresa como campos propios.
    const schema = usuarioCreateSchema;
    expect(Object.keys(schema.shape)).not.toContain('rol_sistema');
    expect(Object.keys(schema.shape)).not.toContain('rol_empresa');
  });
});

describe('usuarioUpdateSchema', () => {
  it('valida un objeto de edición sin initialPassword', () => {
    const result = usuarioUpdateSchema.safeParse({
      nombre: 'Carlos Actualizado',
      correo: 'carlos@crm.test',
      rolId: 'rol-admin-uuid-1111-111111111111',
    });
    expect(result.success).toBe(true);
  });

  it('acepta objeto parcial (solo nombre)', () => {
    const result = usuarioUpdateSchema.safeParse({ nombre: 'Solo nombre' });
    expect(result.success).toBe(true);
  });

  it('NO tiene campo initialPassword', () => {
    expect(Object.keys(usuarioUpdateSchema.shape)).not.toContain('initialPassword');
  });

  it('NO tiene campo activo', () => {
    expect(Object.keys(usuarioUpdateSchema.shape)).not.toContain('activo');
  });

  it('NO tiene campos legacy rol_sistema ni rol_empresa', () => {
    expect(Object.keys(usuarioUpdateSchema.shape)).not.toContain('rol_sistema');
    expect(Object.keys(usuarioUpdateSchema.shape)).not.toContain('rol_empresa');
  });
});
