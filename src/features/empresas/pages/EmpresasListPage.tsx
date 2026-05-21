import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Empresa } from '@/api/types';
import { useEmpresas } from '../hooks/useEmpresas';
import { EmpresasTable } from '../components/EmpresasTable';
import { EmpresaFormDialog } from '../components/EmpresaFormDialog';
import { EmpresaDeleteDialog } from '../components/EmpresaDeleteDialog';

export function EmpresasListPage() {
  const navigate = useNavigate();
  const { data: empresas, isLoading, isError } = useEmpresas();

  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [deleting, setDeleting] = useState<Empresa | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las empresas vinculadas al CRM.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nueva empresa
        </Button>
      </header>

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Buscar por nombre o sector..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          aria-label="Buscar empresas"
        />
      </div>

      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Cargando empresas...
        </p>
      )}

      {isError && (
        <p className="py-12 text-center text-sm text-destructive">
          No fue posible cargar las empresas. Intenta de nuevo.
        </p>
      )}

      {!isLoading && !isError && empresas && (
        <div className="rounded-md border">
          <EmpresasTable
            empresas={empresas}
            searchTerm={searchTerm}
            onView={(empresa) => navigate(`/empresas/${empresa.id}`)}
            onEdit={(empresa) => setEditing(empresa)}
            onDelete={(empresa) => setDeleting(empresa)}
          />
        </div>
      )}

      <EmpresaFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {editing && (
        <EmpresaFormDialog
          mode="edit"
          empresa={editing}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}

      <EmpresaDeleteDialog
        empresa={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
