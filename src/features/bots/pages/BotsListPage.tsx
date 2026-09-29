import { useState } from 'react';
import { Bot as BotIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { RefreshIcon } from '@/components/shared/RefreshButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import type { Bot } from '@/api/types';
import { useBots } from '../hooks/useBots';
import { BotsTable } from '../components/BotsTable';
import { BotFormDialog } from '../components/BotFormDialog';
import { BotTokenDialog } from '../components/BotTokenDialog';

export function BotsListPage() {
  const { data: bots, isPending, isError, isFetching, refetch } = useBots();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Bot | null>(null);
  const [tokenTarget, setTokenTarget] = useState<Bot | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bots"
        description="Conectá workflows de n8n al CRM como Agent Bot: reciben los mensajes entrantes por webhook y responden con un token."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuevo bot
          </Button>
        }
      />

      {isPending && (
        <div className="rounded-md border">
          <TableSkeleton columns={6} rows={3} />
        </div>
      )}

      {isError && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">No fue posible cargar los bots.</p>
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-busy={isFetching}
          >
            <RefreshIcon isRefreshing={isFetching} />
            {isFetching ? 'Cargando...' : 'Reintentar'}
          </Button>
        </div>
      )}

      {!isPending && !isError && bots && bots.length === 0 && (
        <EmptyState
          icon={BotIcon}
          title="Aún no hay bots conectados"
          description="Creá un bot y pegá la URL del nodo Webhook de tu workflow de n8n para que pueda responder los mensajes entrantes."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nuevo bot
            </Button>
          }
        />
      )}

      {!isPending && !isError && bots && bots.length > 0 && (
        <div className="rounded-md border">
          <BotsTable bots={bots} onEdit={(b) => setEditTarget(b)} />
        </div>
      )}

      <BotFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(bot) => setTokenTarget(bot)}
      />

      {editTarget && (
        <BotFormDialog
          mode="edit"
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          bot={editTarget}
        />
      )}

      <BotTokenDialog bot={tokenTarget} onOpenChange={(v) => !v && setTokenTarget(null)} />
    </div>
  );
}
