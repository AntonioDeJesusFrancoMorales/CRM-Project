import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Building2, Contact2, Handshake, KanbanSquare, CalendarClock, ShieldCheck, ClipboardList, Settings, MessageSquare, Wifi, Users, FileText, Bot, ChevronDown, type LucideIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
}

// Grupo principal. Tratos va al final para quedar pegado a "Mis tareas" (ítem dinámico).
const mainItems: NavItem[] = [
  { label: 'Empresas', to: '/empresas', icon: Building2 },
  { label: 'Contactos', to: '/contactos', icon: Contact2 },
  { label: 'Agenda', to: '/agenda', icon: CalendarClock },
  { label: 'Tratos', to: '/tratos', icon: Handshake },
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
  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors';

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div
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
}

function WhatsappNavGroup() {
  const location = useLocation();
  const isSubItemActive = whatsappSubItems.some((item) => location.pathname.startsWith(item.to));
  const [open, setOpen] = useState(isSubItemActive);
  const Icon = whatsappItem.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center">
        <NavLink
          to={whatsappItem.to}
          className={({ isActive }) =>
            cn(
              baseClasses,
              'flex-1 text-foreground hover:bg-muted',
              isActive && !isSubItemActive && 'bg-muted font-medium',
            )
          }
        >
          <Icon className="h-4 w-4" />
          <span>{whatsappItem.label}</span>
        </NavLink>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            aria-label="Mostrar submenú de WhatsApp"
            className="p-2 rounded-md hover:bg-muted text-muted-foreground"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pl-6 space-y-1 pt-1">
        {whatsappSubItems.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

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
      <nav className="flex-1 p-3 flex flex-col space-y-1">
        {mainItems.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}

        {/* "Mis tareas" — ítem dinámico: filtra por responsable_id del usuario logueado (ADR-054) */}
        {usuario && (
          <NavLink
            to={`/tareas?responsable_id=${usuario.usuario_id}`}
            className={({ isActive }) =>
              cn(
                baseClasses,
                'text-foreground hover:bg-muted',
                isActive && 'bg-muted font-medium',
              )
            }
          >
            <ClipboardList className="h-4 w-4" />
            <span>Mis tareas</span>
          </NavLink>
        )}

        {/* Tableros — justo debajo de "Mis tareas" */}
        <NavItemLink item={tablerosItem} />

        {/* WhatsApp inbox + submenú colapsable (grupos, canales, ajustes, plantillas) */}
        <WhatsappNavGroup />

        {/* Administración: pineado al fondo con mt-auto, separado por un divisor. */}
        <div className="mt-auto pt-3 border-t space-y-1">
          {adminItems.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </div>
      </nav>
      <div className="p-3 border-t text-[11px] text-muted-foreground">
        <p>Pipely</p>
        <p className="opacity-70">Residencia · v0.1.0</p>
      </div>
    </aside>
  );
}
