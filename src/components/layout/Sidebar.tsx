import { NavLink } from 'react-router';
import { Building2, Contact2, Handshake, KanbanSquare, CalendarClock, ShieldCheck, ClipboardList, Settings, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
}

const items: NavItem[] = [
  { label: 'Empresas', to: '/empresas', icon: Building2 },
  { label: 'Contactos', to: '/contactos', icon: Contact2 },
  { label: 'Tratos', to: '/tratos', icon: Handshake },
  { label: 'Tableros', to: '/tableros', icon: KanbanSquare },
  { label: 'Agenda', to: '/agenda', icon: CalendarClock },
  { label: 'Usuarios', to: '/usuarios', icon: ShieldCheck },
  { label: 'Configuración', to: '/configuracion', icon: Settings },
];

export function Sidebar() {
  // Todos los ítems se muestran a cualquier usuario autenticado. El back NO enforza
  // autorización por rol (solo autenticación), así que ocultar ítems por "rol" sería
  // falsa seguridad. Ver capability frontend-authorization.
  const usuario = useAuthStore((s) => s.usuario);

  return (
    <aside className="w-60 shrink-0 border-r bg-card flex flex-col">
      <div className="h-14 flex items-center px-4 border-b">
        <span className="font-semibold tracking-tight">Pipely</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items
          .map((item) => {
            const Icon = item.icon;
            const baseClasses =
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors';

            if (item.disabled) {
              return (
                <div
                  key={item.to}
                  className={cn(
                    baseClasses,
                    'text-muted-foreground/70 cursor-not-allowed select-none',
                  )}
                  aria-disabled="true"
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] uppercase tracking-wide rounded-full bg-muted px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    baseClasses,
                    'text-foreground hover:bg-muted',
                    isActive && 'bg-muted font-medium',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

        {/* "Mis tareas" — ítem dinámico: filtra por responsable_id del usuario logueado (ADR-054) */}
        {usuario && (
          <NavLink
            to={`/tareas?responsable_id=${usuario.usuario_id}`}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                'text-foreground hover:bg-muted',
                isActive && 'bg-muted font-medium',
              )
            }
          >
            <ClipboardList className="h-4 w-4" />
            <span>Mis tareas</span>
          </NavLink>
        )}
      </nav>
      <div className="p-3 border-t text-[11px] text-muted-foreground">
        <p>Pipely</p>
        <p className="opacity-70">Residencia · v0.1.0</p>
      </div>
    </aside>
  );
}
