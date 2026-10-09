import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { isHttpError } from '@/api/http-error';
import type { AgentMessageRequest } from '@/api/types';
import { cn } from '@/lib/utils';
import { useSendAssistantMessage } from '../hooks/useSendAssistantMessage';

const MAX_MESSAGE_LENGTH = 4000;
const TYPING_MIN_DURATION_MS = 280;
const TYPING_CHARACTER_DURATION_MS = 5;
const TYPING_MAX_DURATION_MS = 1400;
const TYPING_INSTANT_THRESHOLD = 0.9;

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

function TypingMessage({ content, animate }: { content: string; animate: boolean }) {
  const [visibleText, setVisibleText] = useState(animate ? '' : content);

  useEffect(() => {
    if (!animate) {
      setVisibleText(content);
      return;
    }

    setVisibleText('');
    let index = 0;
    const duration = Math.min(
      TYPING_MAX_DURATION_MS,
      Math.max(TYPING_MIN_DURATION_MS, TYPING_MIN_DURATION_MS + content.length * TYPING_CHARACTER_DURATION_MS),
    );
    const startedAt = window.performance.now();
    let timer: number;

    function tick() {
      const elapsed = window.performance.now() - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const nextIndex =
        progress >= TYPING_INSTANT_THRESHOLD
          ? content.length
          : Math.floor(
              Math.pow(progress / TYPING_INSTANT_THRESHOLD, 2.4) *
                content.length *
                TYPING_INSTANT_THRESHOLD,
            );

      if (nextIndex !== index) {
        index = nextIndex;
        setVisibleText(content.slice(0, index));
      }

      if (index < content.length) {
        timer = window.setTimeout(tick, 16);
      }
    }

    timer = window.setTimeout(tick, 16);

    return () => window.clearTimeout(timer);
  }, [content, animate]);

  return (
    <>
      {visibleText}
      {animate && visibleText.length < content.length ? (
        <span
          className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-[-2px]"
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}

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
  const [buttonVisible, setButtonVisible] = useState(true);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<AssistantChatMessage[]>([initialMessage]);
  const [animatedMessageId, setAnimatedMessageId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedRequest, setFailedRequest] = useState<AgentMessageRequest | null>(null);
  const [failedMessageId, setFailedMessageId] = useState<string | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const messageContentRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const sendMutation = useSendAssistantMessage();

  useEffect(() => {
    stickToBottomRef.current = true;
    const viewport = scrollViewportRef.current;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
      return;
    }

    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sendMutation.isPending]);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    const content = messageContentRef.current;
    if (!viewport || !content) return;
    const scrollViewport = viewport;

    function handleScroll() {
      stickToBottomRef.current =
        scrollViewport.scrollHeight - scrollViewport.scrollTop - scrollViewport.clientHeight < 48;
    }

    function followContent() {
      if (stickToBottomRef.current) scrollViewport.scrollTop = scrollViewport.scrollHeight;
    }

    followContent();
    scrollViewport.addEventListener('scroll', handleScroll, { passive: true });
    const observer = new ResizeObserver(followContent);
    observer.observe(content);
    observer.observe(scrollViewport);

    return () => {
      scrollViewport.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (open) {
      setButtonVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setButtonVisible(true), 1100);
    return () => window.clearTimeout(timer);
  }, [open]);

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
        const assistantMessageId = createId('assistant');
        setMessages((current) => [
          ...current,
          { id: assistantMessageId, role: 'assistant', content: response.content },
        ]);
        setAnimatedMessageId(assistantMessageId);
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
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon-lg"
          className={cn(
            'fixed bottom-4 right-4 z-40 h-14 w-14 rounded-2xl shadow-lg shadow-primary/25 transition-[transform,opacity] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:scale-105 active:scale-95 [&_svg]:size-7',
            buttonVisible ? 'scale-100 opacity-100' : 'pointer-events-none scale-0 opacity-0',
          )}
          aria-label={open ? 'Cerrar asistente' : 'Abrir asistente de chat'}
        >
          <Bot className="h-7 w-7" />
        </Button>
      </DialogTrigger>

      {open ? (
        <div
          aria-hidden="true"
          data-state="open"
          className="fixed inset-0 isolate z-50 bg-transparent backdrop-blur-none supports-[backdrop-filter]:backdrop-blur-none"
        />
      ) : null}

      <DialogContent
        forceMount
        aria-hidden={!open}
        showCloseButton={false}
        overlayClassName="bg-transparent backdrop-blur-none supports-[backdrop-filter]:backdrop-blur-none"
        className={cn(
          '!bottom-4 !left-auto !right-4 !top-auto !translate-x-0 !translate-y-0 flex !w-0 flex-col items-end gap-0 overflow-hidden !border-0 !bg-transparent !p-0 !shadow-none !ring-0 !animate-none transition-[width] [transition-duration:800ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-[width] sm:max-w-none',
          open
            ? 'pointer-events-auto !w-[calc(100vw-2rem)] delay-0 sm:!w-[420px]'
            : 'pointer-events-none [transition-delay:600ms]',
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            'h-1 origin-right rounded-full bg-primary shadow-[0_0_18px_var(--primary)] transition-[width,opacity] [transition-duration:800ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-[width,opacity]',
            open ? 'w-full opacity-100 delay-0' : 'w-0 opacity-0 [transition-delay:600ms]',
          )}
        />

        <div
          className={cn(
            'flex max-h-0 w-full origin-bottom-right scale-y-0 flex-col overflow-hidden rounded-2xl border bg-popover/95 text-popover-foreground shadow-2xl shadow-black/20 backdrop-blur transition-[max-height,transform,opacity,margin] [transition-duration:600ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] will-change-[max-height,transform,opacity]',
            open
              ? 'pointer-events-auto mt-2 max-h-[calc(100vh-96px)] scale-y-100 opacity-100 [transition-delay:750ms]'
              : 'pointer-events-none max-h-0 scale-y-0 opacity-0 delay-0',
          )}
        >

          <DialogHeader
            className={cn(
              'relative flex items-start gap-3 border-b bg-gradient-to-br from-primary/10 via-transparent to-transparent p-4 pr-12 transition-[opacity,transform] duration-300',
              open ? 'translate-y-0 opacity-100 [transition-delay:1000ms]' : 'translate-y-2 opacity-0 delay-0',
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-medium">Asistente</DialogTitle>
              <DialogDescription>
                Consulta la información disponible en tu CRM.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Cerrar asistente"
                className="absolute right-3 top-3"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div
            ref={scrollViewportRef}
            className="chat-scroll-container min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
          >
            <div ref={messageContentRef} className="space-y-3">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    data-message-role={message.role}
                    className={cn(
                      'flex animate-in fade-in slide-in-from-bottom-1 duration-300',
                      isUser ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <p
                      className={cn(
                        'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm [overflow-wrap:anywhere]',
                        isUser
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md bg-muted text-foreground',
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <TypingMessage
                          content={message.content}
                          animate={message.id === animatedMessageId}
                        />
                      ) : (
                        message.content
                      )}
                    </p>
                  </div>
                );
              })}
              {sendMutation.isPending && (
                <div
                  className="flex animate-in fade-in justify-start duration-200"
                  aria-label="El asistente está escribiendo"
                >
                  <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mx-3 mb-2 flex items-center justify-between gap-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <span className="min-w-0 flex-1">{errorMessage}</span>
              <Button type="button" variant="outline" size="sm" onClick={retryFailedRequest}>
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
              className="min-h-[42px] max-h-32 flex-1 resize-none rounded-xl border bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Enviar mensaje"
              className="size-9 rounded-xl transition-transform hover:scale-105 active:scale-95"
              disabled={sendMutation.isPending || !draft.trim()}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
