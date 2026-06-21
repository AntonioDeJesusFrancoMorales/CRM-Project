import { LogOut, Menu } from 'lucide-react';
import { useLocation } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// Título de la página según la ruta (más específicas primero).
const TITULOS: { prefijo: string; titulo: string }[] = [
  { prefijo: '/whatsapp/grupos', titulo: 'Grupos de WhatsApp' },
  { prefijo: '/whatsapp/canales', titulo: 'Canales de WhatsApp' },
  { prefijo: '/whatsapp/ajustes', titulo: 'Ajustes de WhatsApp' },
  { prefijo: '/whatsapp/plantillas', titulo: 'Plantillas' },
  { prefijo: '/whatsapp/bots', titulo: 'Bots' },
  { prefijo: '/whatsapp', titulo: 'WhatsApp' },
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

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useLogout();
  const { pathname } = useLocation();

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-sm font-semibold truncate">{tituloDeRuta(pathname)}</h1>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-auto py-1">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {usuario ? getInitials(usuario.username) : '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">
                {usuario?.username ?? 'Usuario'}
              </span>
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
