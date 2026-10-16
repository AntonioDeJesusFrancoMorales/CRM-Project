import type {
  AccionPermiso,
  AlcancePermiso,
  GrupoSensible,
  PermisoRecurso,
  RecursoCRM,
  Rol,
} from '@/api/types';

const RECURSOS: readonly RecursoCRM[] = [
  'TABLERO',
  'COLUMNA',
  'FICHA',
  'TRATO',
  'TAREA',
  'CONTACTO',
  'EMPRESA',
  'ETIQUETA',
  'AGENDA',
  'ROL',
  'USUARIO',
];

const RECURSOS_NEGOCIO: readonly RecursoCRM[] = [
  'TABLERO',
  'COLUMNA',
  'FICHA',
  'TRATO',
  'TAREA',
  'CONTACTO',
  'EMPRESA',
  'ETIQUETA',
  'AGENDA',
];

const RECURSOS_PROPIOS: readonly RecursoCRM[] = ['TRATO', 'TAREA', 'CONTACTO', 'EMPRESA', 'AGENDA'];

const TABLEROS_EJECUTIVO = [
  '02367727-0e7d-44b5-bb7e-d5cd75c0bfea',
  '36cf746a-475c-4816-9a02-f7bc231fe9b7',
];

const ACCIONES_LECTURA: readonly AccionPermiso[] = ['LEER'];
const ACCIONES_OPERATIVAS: readonly AccionPermiso[] = ['LEER', 'CREAR', 'ACTUALIZAR'];
const ACCIONES_DIRECCION: readonly AccionPermiso[] = ['LEER', 'CREAR', 'ACTUALIZAR', 'ELIMINAR'];
const ACCIONES_ADMINISTRADOR: readonly AccionPermiso[] = [
  'LEER',
  'CREAR',
  'ACTUALIZAR',
  'ELIMINAR',
  'ADMINISTRAR',
];

interface PermissionOptions {
  alcance?: AlcancePermiso;
  idsPermitidos?: string[] | null;
  gruposLectura?: GrupoSensible[];
  gruposEscritura?: GrupoSensible[];
}

function permiso(
  recurso: RecursoCRM,
  acciones: readonly AccionPermiso[],
  options: PermissionOptions = {},
): PermisoRecurso {
  return {
    recurso,
    acciones: [...acciones],
    alcance: options.alcance ?? 'TODO_COMPARTIDO',
    idsPermitidos: options.idsPermitidos ? [...options.idsPermitidos] : null,
    gruposLectura: [...(options.gruposLectura ?? [])],
    gruposEscritura: [...(options.gruposEscritura ?? [])],
  };
}

function permisosAdministrador(): PermisoRecurso[] {
  return RECURSOS.map((recurso) =>
    permiso(recurso, ACCIONES_ADMINISTRADOR, {
      gruposLectura: ['FINANCIERO', 'CONTACTO_PRIVADO'],
      gruposEscritura: ['FINANCIERO', 'CONTACTO_PRIVADO'],
    }),
  );
}

function permisosDireccion(): PermisoRecurso[] {
  return RECURSOS.map((recurso) => {
    if (RECURSOS_NEGOCIO.includes(recurso)) {
      const grupos: GrupoSensible[] =
        recurso === 'TABLERO' || recurso === 'TRATO'
          ? ['FINANCIERO']
          : recurso === 'CONTACTO' || recurso === 'EMPRESA'
            ? ['CONTACTO_PRIVADO']
            : [];
      return permiso(recurso, ACCIONES_DIRECCION, {
        gruposLectura: grupos,
        gruposEscritura: grupos,
      });
    }

    return permiso(recurso, ACCIONES_LECTURA, {
      gruposLectura: recurso === 'USUARIO' ? ['CONTACTO_PRIVADO'] : [],
    });
  });
}

function permisosEjecutivo(): PermisoRecurso[] {
  return RECURSOS.map((recurso) => {
    if (recurso === 'TABLERO' || recurso === 'COLUMNA' || recurso === 'FICHA') {
      return permiso(recurso, ACCIONES_LECTURA, {
        alcance: 'TABLEROS_PERMITIDOS',
        idsPermitidos: TABLEROS_EJECUTIVO,
      });
    }
    if (RECURSOS_PROPIOS.includes(recurso)) {
      return permiso(recurso, ACCIONES_OPERATIVAS, { alcance: 'PROPIOS_O_ASIGNADOS' });
    }
    if (recurso === 'ETIQUETA') return permiso(recurso, ACCIONES_OPERATIVAS);
    return permiso(recurso, ACCIONES_LECTURA);
  });
}

function permisosOperaciones(): PermisoRecurso[] {
  return RECURSOS.map((recurso) =>
    permiso(recurso, RECURSOS_NEGOCIO.includes(recurso) ? ACCIONES_OPERATIVAS : ACCIONES_LECTURA),
  );
}

function permisosConsulta(): PermisoRecurso[] {
  return RECURSOS.map((recurso) => permiso(recurso, ACCIONES_LECTURA));
}

// Los UUIDs deben coincidir con los rolId usados en el fixture de usuarios.
export const rolesFixture: Rol[] = [
  {
    id: 'a022c4fb-c079-4072-a4e8-dd7e4f5789df',
    nombre: 'Administrador',
    descripcion: 'Administra usuarios, roles y todos los recursos comerciales del CRM.',
    activo: true,
    permisos: permisosAdministrador(),
  },
  {
    id: '438f125b-6670-4011-9991-7fa03e827481',
    nombre: 'Dirección Comercial',
    descripcion: 'Supervisa la operación comercial compartida y gestiona información sensible.',
    activo: true,
    permisos: permisosDireccion(),
  },
  {
    id: '29b89553-71ec-4bdd-9a10-fa64ee5d6609',
    nombre: 'Ejecutivo Comercial',
    descripcion: 'Gestiona su cartera y los registros comerciales asignados.',
    activo: true,
    permisos: permisosEjecutivo(),
  },
  {
    id: 'b1000000-0000-4000-8000-000000000003',
    nombre: 'Operaciones CRM',
    descripcion: 'Mantiene la operación diaria del CRM y sus catálogos compartidos.',
    activo: true,
    permisos: permisosOperaciones(),
  },
  {
    id: 'b1000000-0000-4000-8000-000000000002',
    nombre: 'Consulta',
    descripcion: 'Consulta todos los recursos del CRM sin permisos de escritura.',
    activo: true,
    permisos: permisosConsulta(),
  },
];
