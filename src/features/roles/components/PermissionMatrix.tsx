import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AccionPermiso, GrupoSensible, PermisoRecurso, RecursoCRM } from '@/api/types';
import {
  ACCIONES_PERMISO,
  ALCANCES_PERMISO,
  applyPermissionTemplate,
  createEmptyPermission,
  createDefaultPermissionMatrix,
  getSupportedScopes,
  GRUPOS_SENSIBLES,
  RECURSOS_CRM,
  supportsScope,
  type PermissionTemplate,
} from '@/features/permissions/lib/permissions';
import type { PermisoRecursoInput } from '../schemas/rol.schema';

const recursoLabels: Record<RecursoCRM, string> = {
  TABLERO: 'Tableros',
  COLUMNA: 'Columnas',
  FICHA: 'Fichas',
  TRATO: 'Tratos',
  TAREA: 'Tareas',
  CONTACTO: 'Contactos',
  EMPRESA: 'Empresas',
  ETIQUETA: 'Etiquetas',
  AGENDA: 'Agenda',
  ROL: 'Roles',
  USUARIO: 'Usuarios',
};

const accionLabels: Record<AccionPermiso, string> = {
  LEER: 'Leer',
  CREAR: 'Crear',
  ACTUALIZAR: 'Actualizar',
  ELIMINAR: 'Eliminar',
  ADMINISTRAR: 'Administrar',
};

const alcanceLabels: Record<(typeof ALCANCES_PERMISO)[number], string> = {
  TODO_COMPARTIDO: 'Todo compartido',
  PROPIOS_O_ASIGNADOS: 'Propios o asignados',
  TABLEROS_PERMITIDOS: 'Tableros permitidos',
};

const grupoLabels: Record<GrupoSensible, string> = {
  FINANCIERO: 'Financiero',
  CONTACTO_PRIVADO: 'Contacto privado',
};

const templateLabels: Record<PermissionTemplate, string> = {
  SIN_ACCESO: 'Sin acceso',
  SOLO_LECTURA: 'Solo lectura',
  OPERATIVO: 'Operativo',
  ADMINISTRADOR: 'Administrador',
};

const templates: PermissionTemplate[] = [
  'SIN_ACCESO',
  'SOLO_LECTURA',
  'OPERATIVO',
  'ADMINISTRADOR',
];

interface PermissionMatrixProps {
  value?: PermisoRecursoInput[];
  onChange: (value: PermisoRecursoInput[]) => void;
  disabled?: boolean;
}

function asInput(permission: PermisoRecurso): PermisoRecursoInput {
  return {
    recurso: permission.recurso,
    acciones: permission.acciones,
    alcance: permission.alcance,
    idsPermitidos: permission.idsPermitidos,
    gruposLectura: permission.gruposLectura,
    gruposEscritura: permission.gruposEscritura,
  };
}

function normalizeMatrix(value: PermisoRecursoInput[] | undefined): PermisoRecursoInput[] {
  const current = value ?? [];
  return RECURSOS_CRM.map((recurso) => {
    const existing = current.find((permission) => permission.recurso === recurso);
    return existing && supportsScope(recurso, existing.alcance)
      ? existing
      : asInput(createEmptyPermission(recurso));
  });
}

function idsToString(ids: string[] | null): string {
  return ids?.join(', ') ?? '';
}

export function PermissionMatrix({ value, onChange, disabled = false }: PermissionMatrixProps) {
  const matrix = normalizeMatrix(value);

  function updatePermission(recurso: RecursoCRM, patch: Partial<PermisoRecursoInput>) {
    onChange(
      matrix.map((permission) =>
        permission.recurso === recurso ? { ...permission, ...patch } : permission,
      ),
    );
  }

  function updateAction(recurso: RecursoCRM, accion: AccionPermiso, checked: boolean) {
    const permission = matrix.find((item) => item.recurso === recurso) ?? asInput(createEmptyPermission(recurso));
    const acciones = checked
      ? [...new Set([...permission.acciones, accion])]
      : permission.acciones.filter((current) => current !== accion);
    updatePermission(recurso, { acciones });
  }

  function updateGroup(
    recurso: RecursoCRM,
    field: 'gruposLectura' | 'gruposEscritura',
    grupo: GrupoSensible,
    checked: boolean,
  ) {
    const permission = matrix.find((item) => item.recurso === recurso) ?? asInput(createEmptyPermission(recurso));
    const groups = permission[field] ?? [];
    const nextGroups = checked
      ? [...new Set([...groups, grupo])]
      : groups.filter((current) => current !== grupo);
    updatePermission(recurso, { [field]: nextGroups });
  }

  function handleScopeChange(recurso: RecursoCRM, event: ChangeEvent<HTMLSelectElement>) {
    const alcance = event.target.value as PermisoRecursoInput['alcance'];
    updatePermission(recurso, {
      alcance,
      idsPermitidos:
        alcance === 'TABLEROS_PERMITIDOS'
          ? matrix.find((permission) => permission.recurso === recurso)?.idsPermitidos ?? []
          : null,
    });
  }

  function handleIdsChange(recurso: RecursoCRM, event: ChangeEvent<HTMLInputElement>) {
    const ids = event.target.value
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    updatePermission(recurso, { idsPermitidos: ids });
  }

  function setTemplate(template: PermissionTemplate) {
    onChange(applyPermissionTemplate(template).map(asInput));
  }

  return (
    <section className="space-y-4 rounded-lg border bg-muted/20 p-3" aria-label="Matriz de permisos CRM">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium">Permisos CRM</h3>
          <p className="text-xs text-muted-foreground">
            Las acciones se envían explícitamente al guardar. Una lista vacía revoca el acceso de ese recurso.
          </p>
        </div>
        <div className="flex flex-wrap gap-1" aria-label="Plantillas de permisos">
          {templates.map((template) => (
            <Button
              key={template}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => setTemplate(template)}
            >
              {templateLabels[template]}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {matrix.map((permission) => (
          <div key={permission.recurso} className="rounded-md border bg-background p-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-36">
                <p className="font-medium">{recursoLabels[permission.recurso]}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{permission.recurso}</p>
              </div>

              <div className="flex flex-1 flex-wrap gap-x-4 gap-y-2">
                {ACCIONES_PERMISO.map((accion) => (
                  <label key={accion} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={permission.acciones.includes(accion)}
                      disabled={disabled}
                      onChange={(event) => updateAction(permission.recurso, accion, event.target.checked)}
                    />
                    {accionLabels[accion]}
                  </label>
                ))}
              </div>

              <label className="flex min-w-52 flex-col gap-1 text-xs">
                <span className="font-medium text-muted-foreground">Alcance</span>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={permission.alcance}
                  disabled={disabled}
                  onChange={(event) => handleScopeChange(permission.recurso, event)}
                  aria-label={`Alcance de ${recursoLabels[permission.recurso]}`}
                >
                   {getSupportedScopes(permission.recurso).map((alcance) => (
                    <option key={alcance} value={alcance}>
                      {alcanceLabels[alcance]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {permission.alcance === 'TABLEROS_PERMITIDOS' && (
              <label className="mt-3 block space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">IDs de tableros permitidos</span>
                <Input
                  value={idsToString(permission.idsPermitidos)}
                  disabled={disabled}
                  onChange={(event) => handleIdsChange(permission.recurso, event)}
                  placeholder="UUID-1, UUID-2"
                  aria-label={`IDs permitidos de ${recursoLabels[permission.recurso]}`}
                />
                <span className="text-muted-foreground">Separá los IDs con comas. El backend valida el alcance por fila.</span>
              </label>
            )}

            <div className="mt-3 grid gap-3 border-t pt-3 md:grid-cols-2">
              {(['gruposLectura', 'gruposEscritura'] as const).map((field) => {
                const groups = permission[field];
                const isWrite = field === 'gruposEscritura';
                return (
                  <div key={field} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {isWrite ? 'Grupos sensibles de escritura' : 'Grupos sensibles de lectura'}
                    </p>
                    {groups === null ? (
                      <div className="space-y-2 rounded-md border border-dashed p-2 text-xs text-muted-foreground">
                        <p>El backend no informó este grupo; no se interpreta como una lista editable vacía.</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={disabled}
                          onClick={() => updatePermission(permission.recurso, { [field]: [] })}
                        >
                          Configurar grupos
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {GRUPOS_SENSIBLES.map((grupo) => (
                          <label key={grupo} className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={groups.includes(grupo)}
                              disabled={disabled}
                              onChange={(event) => updateGroup(permission.recurso, field, grupo, event.target.checked)}
                            />
                            {grupoLabels[grupo]}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export const DEFAULT_PERMISSION_MATRIX = createDefaultPermissionMatrix().map(asInput);
