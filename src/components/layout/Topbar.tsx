import type { ReactNode } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { GlobalSearch } from '@/features/global-search/components/GlobalSearch';

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// Título de la página según la ruta (más específicas primero).
const TITULOS: { prefijo: string; titulo: string }[] = [
  { prefijo: '/empresas', titulo: 'Empresas' },
  { prefijo: '/contactos', titulo: 'Contactos' },
  { prefijo: '/agenda', titulo: 'Agenda' },
  { prefijo: '/tratos', titulo: 'Tratos' },
  { prefijo: '/tareas', titulo: 'Tareas' },
  { prefijo: '/tableros', titulo: 'Tableros' },
  { prefijo: '/usuarios', titulo: 'Usuarios' },
  { prefijo: '/configuracion', titulo: 'Configuración' },
];

function tituloDeRuta(pathname: string): string {
  if (pathname === '/') return 'Inicio';
  return TITULOS.find((t) => pathname.startsWith(t.prefijo))?.titulo ?? 'Pipely';
}

export function Topbar({
  onMenuClick,
  sidebarControl,
}: {
  onMenuClick?: () => void;
  sidebarControl?: ReactNode;
}) {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useLogout();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        {sidebarControl}
        <h1 className="text-sm font-semibold truncate">{tituloDeRuta(pathname)}</h1>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            aria-label="Búsqueda global"
            className="h-8 w-full rounded-lg border border-input bg-transparent pr-3 pl-8 text-left text-sm text-muted-foreground outline-none transition-colors placeholder:text-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            Buscar en Pipely...
          </button>
        </div>
        <div className="md:hidden">
          <GlobalSearch />
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Notificaciones" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>
        <ThemeToggle />
        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {usuario ? getInitials(usuario.username) : '?'}
              </span>
              <span className="text-sm font-medium hidden sm:block">
                {usuario?.username ?? 'Usuario'}
              </span>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{usuario?.username}</span>
                <span className="text-xs text-muted-foreground">{usuario?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Mi perfil</DropdownMenuItem>
            <DropdownMenuItem>Preferencias</DropdownMenuItem>
            <DropdownMenuItem>Equipo comercial</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => logout.mutate()}
              disabled={logout.isPending}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
