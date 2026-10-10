import { z } from 'zod';
import { requiredTrimmedName } from '@/lib/validation';
import {
  ACCIONES_PERMISO,
  ALCANCES_PERMISO,
  GRUPOS_SENSIBLES,
  RECURSOS_CRM,
  supportsScope,
} from '@/features/permissions/lib/permissions';

const recursoSchema = z.enum(RECURSOS_CRM);
const accionSchema = z.enum(ACCIONES_PERMISO);
const alcanceSchema = z.enum(ALCANCES_PERMISO);
const grupoSchema = z.enum(GRUPOS_SENSIBLES);

export const permisoRecursoSchema = z
  .object({
    recurso: recursoSchema,
    acciones: z.array(accionSchema),
    alcance: alcanceSchema,
    idsPermitidos: z.array(z.string().trim().uuid('Cada ID permitido debe ser un UUID válido')).nullable(),
    gruposLectura: z.array(grupoSchema).nullable(),
    gruposEscritura: z.array(grupoSchema).nullable(),
  })
  .superRefine((permiso, context) => {
    if (!supportsScope(permiso.recurso, permiso.alcance)) {
      context.addIssue({
        code: 'custom',
        path: ['alcance'],
        message: `El alcance ${permiso.alcance} no es compatible con ${permiso.recurso}`,
      });
    }

    if (permiso.alcance !== 'TABLEROS_PERMITIDOS' && (permiso.idsPermitidos?.length ?? 0) > 0) {
      context.addIssue({
        code: 'custom',
        path: ['idsPermitidos'],
        message: 'Los IDs solo se pueden usar con el alcance TABLEROS_PERMITIDOS',
      });
    }

    if (permiso.alcance === 'TABLEROS_PERMITIDOS' && (permiso.idsPermitidos?.length ?? 0) === 0) {
      context.addIssue({
        code: 'custom',
        path: ['idsPermitidos'],
        message: 'Este alcance requiere al menos un tablero permitido',
      });
    }

    const lectura = permiso.gruposLectura ?? [];
    const escritura = permiso.gruposEscritura ?? [];
    if (escritura.some((grupo) => !lectura.includes(grupo))) {
      context.addIssue({
        code: 'custom',
        path: ['gruposEscritura'],
        message: 'Los grupos de escritura también deben ser legibles',
      });
    }
  });

function validatePermissionMatrix(
  value: { permisos?: z.infer<typeof permisoRecursoSchema>[] },
  context: z.RefinementCtx,
) {
  if (!value.permisos) return;
  const seen = new Set<string>();
  value.permisos.forEach((permiso, index) => {
    if (seen.has(permiso.recurso)) {
      context.addIssue({
        code: 'custom',
        path: ['permisos', index, 'recurso'],
        message: 'Cada recurso debe aparecer una sola vez',
      });
    }
    seen.add(permiso.recurso);
  });
}

// Schema para crear un rol del CRM — alineado al contrato del back (RolController.create).
// nombre: requerido, máximo 80 chars. descripcion: opcional.
// `activo` NO va en el payload: el back lo fuerza a true al crear (display-only en el front).
export const rolCreateSchema = z.object({
  nombre: requiredTrimmedName(80, 'Máximo 80 caracteres'),
  descripcion: z.string().max(255, 'Máximo 255 caracteres').optional(),
  permisos: z.array(permisoRecursoSchema).optional(),
}).superRefine(validatePermissionMatrix);

// Schema para editar un rol — alineado a RolController.edit (todos los campos opcionales).
export const rolUpdateSchema = z.object({
  nombre: requiredTrimmedName(80, 'Máximo 80 caracteres').optional(),
  descripcion: z.string().max(255, 'Máximo 255 caracteres').optional(),
  permisos: z.array(permisoRecursoSchema).optional(),
}).superRefine(validatePermissionMatrix);

export type RolCreateInput = z.infer<typeof rolCreateSchema>;
export type RolUpdateInput = z.infer<typeof rolUpdateSchema>;
export type PermisoRecursoInput = z.infer<typeof permisoRecursoSchema>;
