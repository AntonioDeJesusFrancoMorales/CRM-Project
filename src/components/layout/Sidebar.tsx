import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Building2, Contact2, Handshake, KanbanSquare, CalendarClock, ShieldCheck, ClipboardList, Settings, MessageSquare, Wifi, Users, FileText, Bot, ChevronDown, LayoutDashboard, Waypoints, type LucideIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
  end?: boolean; // match exacto (para "/" que si no quedaría activo en todas las rutas)
}

// Grupo principal. Tratos va al final para quedar pegado a "Mis tareas" (ítem dinámico).
const mainItems: NavItem[] = [
  { label: 'Inicio', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Empresas', to: '/empresas', icon: Building2 },
  { label: 'Contactos', to: '/contactos', icon: Contact2 },
  { label: 'Agenda', to: '/agenda', icon: CalendarClock },
  { label: 'Tratos', to: '/tratos', icon: Handshake, badge: '7' },
];

// "Tableros" va DEBAJO de "Mis tareas" (no en el grupo principal).
const tablerosItem: NavItem = { label: 'Tableros', to: '/tableros', icon: KanbanSquare };

const whatsappItem: NavItem = { label: 'WhatsApp', to: '/whatsapp', icon: MessageSquare };
const whatsappSubItems: NavItem[] = [
  { label: 'Grupos', to: '/whatsapp/grupos', icon: Users },
  { label: 'Canales', to: '/whatsapp/canales', icon: Wifi },
  { label: 'Bots', to: '/whatsapp/bots', icon: Bot },
  { label: 'Ajustes', to: '/whatsapp/ajustes', icon: Settings },
  { label: 'Plantillas', to: '/whatsapp/plantillas', icon: FileText },
];

// Administración: pineado al fondo del sidebar, separado del grupo principal.
const adminItems: NavItem[] = [
  { label: 'Usuarios', to: '/usuarios', icon: ShieldCheck },
  { label: 'Configuración', to: '/configuracion', icon: Settings },
];

const baseClasses =
  'relative flex items-center rounded-md text-sm font-medium transition-colors';

function NavItemLink({ item, onNavigate, collapsed }: { item: NavItem; onNavigate?: () => void; collapsed?: boolean }) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div
        className={cn(
          baseClasses,
          collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-2',
          'text-muted-foreground/70 cursor-not-allowed select-none',
        )}
        aria-disabled="true"
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
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
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          baseClasses,
          collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-2',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        )
      }
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
    >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-medium tabular-nums text-primary">
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <span className="absolute right-1.5 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
        )}
    </NavLink>
  );
}

function WhatsappNavGroup({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const location = useLocation();
  const isSubItemActive = whatsappSubItems.some((item) => location.pathname.startsWith(item.to));
  const [open, setOpen] = useState(isSubItemActive);
  const Icon = whatsappItem.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center">
        <NavLink
          to={whatsappItem.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              baseClasses,
              collapsed ? 'justify-center px-2 py-2' : 'flex-1 gap-2.5 px-2.5 py-2',
              isActive && !isSubItemActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            )
          }
          title={collapsed ? whatsappItem.label : undefined}
          aria-label={collapsed ? whatsappItem.label : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{whatsappItem.label}</span>}
        </NavLink>
        {!collapsed && <CollapsibleTrigger asChild>
          <button
            type="button"
            aria-label="Mostrar submenú de WhatsApp"
            className="rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </button>
        </CollapsibleTrigger>}
      </div>
      {!collapsed && <CollapsibleContent className="space-y-1 pl-6 pt-1">
        {whatsappSubItems.map((item) => (
          <NavItemLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </CollapsibleContent>}
    </Collapsible>
  );
}

export function Sidebar({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  // Todos los ítems se muestran a cualquier usuario autenticado. El back NO enforza
  // autorización por rol (solo autenticación), así que ocultar ítems por "rol" sería
  // falsa seguridad. Ver capability frontend-authorization.
  const usuario = useAuthStore((s) => s.usuario);
  const initials = usuario ? usuario.username.slice(0, 2).toUpperCase() : 'PI';

  return (
    <aside className="flex h-full flex-col gap-6 bg-sidebar" role="navigation" aria-label="Menú principal">
      <div className={cn('flex h-14 items-center gap-2.5 border-b border-sidebar-border', collapsed ? 'justify-center px-2' : 'px-5')}>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Waypoints className="h-4 w-4" />
        </div>
        {!collapsed && <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">Pipely</span>}
      </div>
      <nav className={cn('flex flex-1 flex-col gap-6 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        <div className="flex flex-col gap-1.5">
          {!collapsed && (
            <p className="px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
              Comercial
            </p>
          )}
        {mainItems.map((item) => (
          <NavItemLink key={item.to} item={item} onNavigate={onNavigate} collapsed={collapsed} />
        ))}

        {/* "Mis tareas" — ítem dinámico: filtra por responsable_id del usuario logueado (ADR-054) */}
        {usuario && (
          <NavLink
            to={`/tareas?responsable_id=${usuario.usuario_id}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                baseClasses,
                collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-2',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )
            }
            title={collapsed ? 'Mis tareas' : undefined}
            aria-label={collapsed ? 'Mis tareas' : undefined}
          >
            <ClipboardList className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Mis tareas</span>}
          </NavLink>
        )}

        {/* Tableros — justo debajo de "Mis tareas" */}
        <NavItemLink item={tablerosItem} onNavigate={onNavigate} collapsed={collapsed} />

        {/* WhatsApp inbox + submenú colapsable (grupos, canales, ajustes, plantillas) */}
        <WhatsappNavGroup onNavigate={onNavigate} collapsed={collapsed} />
        </div>

        {/* Administración: pineado al fondo con mt-auto, separado por un divisor. */}
        <div className="mt-auto flex flex-col gap-1.5 border-t border-sidebar-border pt-3">
          {adminItems.map((item) => (
            <NavItemLink key={item.to} item={item} onNavigate={onNavigate} collapsed={collapsed} />
          ))}
        </div>
      </nav>
      <div className={cn('border-t border-sidebar-border p-3', collapsed && 'flex justify-center')}>
        <div className={cn('flex items-center rounded-md', collapsed ? 'px-0 py-0' : 'gap-2.5 px-2 py-1.5')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{usuario?.username ?? 'Pipely'}</p>
              <p className="truncate text-xs text-muted-foreground">Equipo comercial</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
