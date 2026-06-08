import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { chatWithAi } from "@/lib/ai.functions";

type ToolCallRecord = { name: string; ok: boolean; summary?: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  tools?: ToolCallRecord[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SUGGESTIONS = [
  "Como está meu dia hoje?",
  "Aniversariantes do mês",
  "Pacientes inativos há +30 dias",
  "Cria um lembrete pra ligar pra Maria amanhã às 10h",
  "Agenda consulta com Maria sexta 14h",
  "Marca a consulta de hoje como recebida via PIX",
  "Adiciona despesa R$ 1.500 aluguel",
  "Qual meu lucro do mês?",
  "Busca nos prontuários menções a ansiedade",
];

export function AiAssistant({ open, onOpenChange }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const chat = useServerFn(chatWithAi);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({
        data: {
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        },
      });
      setMessages([
        ...next,
        {
          role: "assistant",
          content: res.content || "(sem resposta)",
          tools: res.tools ?? [],
        },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao falar com a IA";
      toast.error(msg);
      setMessages(messages);
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:items-end md:justify-end">
      <button
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="relative ml-auto w-full md:w-[440px] h-full md:h-[680px] md:m-4 md:rounded-2xl bg-background border border-border/60 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/60 bg-surface/40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand/15 border border-brand/30 grid place-items-center">
              <Sparkles className="h-4 w-4 text-brand" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Assistente</div>
              <div className="text-[10px] text-muted-foreground">
                Cria pacientes, agenda, registra pagamentos e despesas
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-surface text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Sou seu assistente clínico e administrativo. Posso responder dúvidas e
                <strong> executar ações no app</strong> pra você. Tenta:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] px-2.5 py-1.5 rounded-full border border-border/60 bg-surface hover:bg-surface-elevated text-left transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="space-y-1.5">
              <div
                className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-brand text-primary-foreground"
                    : "mr-auto bg-surface border border-border/60"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
              {m.tools && m.tools.length > 0 && (
                <div className="mr-auto max-w-[92%] flex flex-wrap gap-1">
                  {m.tools.map((t, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                        t.ok
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      }`}
                    >
                      <Wrench className="h-2.5 w-2.5" />
                      {t.name}
                      {t.summary ? ` · ${t.summary}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="mr-auto bg-surface border border-border/60 rounded-2xl px-3.5 py-2.5 text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pensando…
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-border/60 p-3 flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ou peça pra fazer…"
            className="flex-1 h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-10 w-10 grid place-items-center rounded-lg bg-brand text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
