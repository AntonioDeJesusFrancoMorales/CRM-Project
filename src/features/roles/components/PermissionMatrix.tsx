import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
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
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';
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
  tableros?: Tablero[];
  isLoading?: boolean;
  isError?: boolean;
  refetch?: () => Promise<unknown> | unknown;
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

interface PermissionCheckboxProps {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

function PermissionCheckbox({ checked, disabled, label, onChange }: PermissionCheckboxProps) {
  return (
    <span className="relative inline-flex size-4 shrink-0">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
        className="peer absolute inset-0 z-10 size-4 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[4px] border border-input bg-background transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:opacity-50 after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-[10px] after:font-bold after:text-primary-foreground after:content-['✓'] after:opacity-0 peer-checked:after:opacity-100"
      />
    </span>
  );
}

interface BoardSelectionProps {
  recurso: RecursoCRM;
  idsPermitidos: string[] | null;
  tableros: Tablero[];
  isLoading: boolean;
  isError: boolean;
  refetch?: () => Promise<unknown> | unknown;
  disabled: boolean;
  onChange: (ids: string[]) => void;
}

function boardTypeLabel(tipoTablero: Tablero['tipoTablero']): string {
  return tipoTablero === 'TRATOS' ? 'Tratos' : 'Tareas';
}

function BoardSelection({
  recurso,
  idsPermitidos,
  tableros,
  isLoading,
  isError,
  refetch,
  disabled,
  onChange,
}: BoardSelectionProps) {
  const selectedIds = idsPermitidos ?? [];
  const availableIds = new Set(tableros.map((tablero) => tablero.id));
  const unavailableIds = [...new Set(selectedIds.filter((id) => !availableIds.has(id)))];

  function handleBoardChange(id: string, checked: boolean) {
    const nextIds = checked
      ? [...new Set([...selectedIds, id])]
      : selectedIds.filter((currentId) => currentId !== id);
    onChange(nextIds);
  }

  return (
    <fieldset className="mt-3 space-y-2 rounded-md border border-border p-3">
      <legend className="px-1 text-xs font-medium text-muted-foreground">
        Tableros permitidos para {recursoLabels[recurso]}
      </legend>

      {isError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/30 p-2 text-xs">
          <span>No fue posible cargar los tableros.</span>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => void refetch?.()}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="max-h-56 overflow-y-auto rounded-md border border-border">
        {isLoading ? (
          <div role="status" aria-busy="true" className="p-3 text-xs text-muted-foreground">
            Cargando tableros…
          </div>
        ) : (
          <>
            {!isError && tableros.length === 0 && unavailableIds.length === 0 && (
              <div className="p-3 text-xs text-muted-foreground">No hay tableros disponibles</div>
            )}

            {tableros.map((tablero) => (
              <label
                key={tablero.id}
                className="flex items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0"
              >
                <PermissionCheckbox
                  checked={selectedIds.includes(tablero.id)}
                  disabled={disabled}
                  label={`Permitir tablero ${tablero.nombre}`}
                  onChange={(checked) => handleBoardChange(tablero.id, checked)}
                />
                <span className="min-w-0 flex-1 truncate">{tablero.nombre}</span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {boardTypeLabel(tablero.tipoTablero)}
                </span>
              </label>
            ))}

            {unavailableIds.map((id) => (
              <div
                key={id}
                className="border-b bg-muted/40 px-3 py-2 text-sm text-muted-foreground last:border-b-0"
              >
                <label className="flex items-start gap-2">
                  <PermissionCheckbox
                    checked
                    disabled={disabled}
                    label={`Permitir tablero seleccionado no disponible ${id}`}
                    onChange={(checked) => handleBoardChange(id, checked)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">Tablero seleccionado no disponible</span>
                    <span className="block break-all font-mono text-[10px]">ID: {id}</span>
                  </span>
                </label>
              </div>
            ))}
          </>
        )}
      </div>
    </fieldset>
  );
}

export function PermissionMatrix({
  value,
  onChange,
  disabled = false,
  tableros = [],
  isLoading = false,
  isError = false,
  refetch,
}: PermissionMatrixProps) {
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

  function setTemplate(template: PermissionTemplate) {
    onChange(applyPermissionTemplate(template).map(asInput));
  }

  return (
    <section className="space-y-4 rounded-lg border bg-muted/20 p-4" aria-label="Matriz de permisos CRM">
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
              className="rounded-md"
              disabled={disabled}
              onClick={() => setTemplate(template)}
            >
              {templateLabels[template]}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <div className="min-w-[760px] space-y-2 p-1">
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
                    <PermissionCheckbox
                      checked={permission.acciones.includes(accion)}
                      disabled={disabled}
                      label={`${recursoLabels[permission.recurso]} ${accionLabels[accion]}`}
                      onChange={(checked) => updateAction(permission.recurso, accion, checked)}
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
              <BoardSelection
                recurso={permission.recurso}
                idsPermitidos={permission.idsPermitidos}
                tableros={tableros}
                isLoading={isLoading}
                isError={isError}
                refetch={refetch}
                disabled={disabled}
                onChange={(ids) => updatePermission(permission.recurso, { idsPermitidos: ids })}
              />
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
                            <PermissionCheckbox
                              checked={groups.includes(grupo)}
                              disabled={disabled}
                              label={`${recursoLabels[permission.recurso]} ${grupoLabels[grupo]}`}
                              onChange={(checked) => updateGroup(permission.recurso, field, grupo, checked)}
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
      </div>
    </section>
  );
}

export const DEFAULT_PERMISSION_MATRIX = createDefaultPermissionMatrix().map(asInput);
