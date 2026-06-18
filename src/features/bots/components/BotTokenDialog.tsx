import { useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Bot } from '@/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  bot: Bot | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Se muestra una sola vez justo después de crear el bot — el back no vuelve a exponer
 * el token completo en la lista (BotsTable lo muestra enmascarado). Si se pierde, hay
 * que recrearlo: no hay endpoint de "regenerar token".
 */
export function BotTokenDialog({ bot, onOpenChange }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!bot) return;
    await navigator.clipboard.writeText(bot.apiAccessToken);
    setCopied(true);
    toast.success('Token copiado');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={!!bot} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Bot creado
          </DialogTitle>
          <DialogDescription>
            Copiá este token y pegalo en el nodo <strong>⚙️ Configuración</strong> del workflow de
            n8n (campo <code>cfg_apiToken</code>). No vuelve a mostrarse completo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="bot-token">api_access_token</Label>
          <div className="flex gap-2">
            <Input id="bot-token" readOnly value={bot?.apiAccessToken ?? ''} className="font-mono text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar token">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
