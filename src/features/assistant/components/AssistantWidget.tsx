import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { isHttpError } from '@/api/http-error';
import type { AgentMessageRequest } from '@/api/types';
import { cn } from '@/lib/utils';
import { useSendAssistantMessage } from '../hooks/useSendAssistantMessage';

const MAX_MESSAGE_LENGTH = 4000;

type AssistantMessageRole = 'user' | 'assistant';

interface AssistantChatMessage {
  id: string;
  role: AssistantMessageRole;
  content: string;
}

const initialMessage: AssistantChatMessage = {
  id: 'assistant-greeting',
  role: 'assistant',
  content: '¡Hola! ¿En qué puedo ayudarte?',
};

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getErrorMessage(error: unknown): string {
  if (isHttpError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'No fue posible enviar el mensaje. Intenta nuevamente.';
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<AssistantChatMessage[]>([initialMessage]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedRequest, setFailedRequest] = useState<AgentMessageRequest | null>(null);
  const [failedMessageId, setFailedMessageId] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const sendMutation = useSendAssistantMessage();

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sendMutation.isPending]);

  function submitRequest(
    request: AgentMessageRequest,
    messageId: string,
    appendUserMessage: boolean,
  ) {
    if (sendingRef.current || sendMutation.isPending) return;

    sendingRef.current = true;
    setErrorMessage(null);

    if (appendUserMessage) {
      setMessages((current) => [
        ...current,
        { id: messageId, role: 'user', content: request.message },
      ]);
      setFailedRequest(null);
      setFailedMessageId(null);
    }

    sendMutation.mutate(request, {
      onSuccess: (response) => {
        setMessages((current) => [
          ...current,
          { id: createId('assistant'), role: 'assistant', content: response.content },
        ]);
        setDraft('');
        setErrorMessage(null);
        setFailedRequest(null);
        setFailedMessageId(null);
        sendingRef.current = false;
      },
      onError: (error) => {
        setErrorMessage(getErrorMessage(error));
        setFailedRequest(request);
        setFailedMessageId(messageId);
        sendingRef.current = false;
      },
    });
  }

  function submitDraft() {
    if (sendingRef.current || sendMutation.isPending) return;

    const message = draft.trim();
    if (!message) return;

    const canReuseFailedRequest = failedRequest?.message === message && failedMessageId !== null;
    const request = canReuseFailedRequest
      ? failedRequest
      : { message, idempotencyKey: createIdempotencyKey() };
    const messageId = canReuseFailedRequest ? failedMessageId : createId('user');

    submitRequest(request, messageId, !canReuseFailedRequest);
  }

  function retryFailedRequest() {
    if (!failedRequest || !failedMessageId) return;
    setDraft(failedRequest.message);
    submitRequest(failedRequest, failedMessageId, false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitDraft();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon-lg"
          className="fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
          aria-label="Abrir asistente de chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>

      <DialogContent
        overlayClassName="bg-transparent backdrop-blur-none supports-[backdrop-filter]:backdrop-blur-none"
        className="!bottom-4 !left-auto !right-4 !top-auto !translate-x-0 !translate-y-0 flex h-[min(36rem,calc(100vh-2rem))] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:bottom-6 sm:right-6"
      >
        <DialogHeader className="border-b p-4 pr-12">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Asistente
          </DialogTitle>
          <DialogDescription>Consulta la información disponible en tu CRM.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1 px-4 py-3">
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  data-message-role={message.role}
                  className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                      isUser
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-muted text-foreground',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}
            {sendMutation.isPending && (
              <div className="flex justify-start" aria-label="El asistente está escribiendo">
                <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
                  <Loader2
                    className="h-4 w-4 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 border-t bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <span className="min-w-0 flex-1">{errorMessage}</span>
            <Button type="button" variant="outline" size="xs" onClick={retryFailedRequest}>
              Reintentar
            </Button>
          </div>
        )}

        <form
          className="flex items-end gap-2 border-t bg-muted/30 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            submitDraft();
          }}
        >
          <Textarea
            value={draft}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={2}
            disabled={sendMutation.isPending}
            aria-label="Mensaje para el asistente"
            placeholder="Escribe un mensaje..."
            className="min-h-[42px] max-h-32 resize-none text-sm"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Enviar mensaje"
            disabled={sendMutation.isPending || !draft.trim()}
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
