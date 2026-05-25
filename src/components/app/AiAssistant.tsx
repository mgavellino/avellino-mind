import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { chatWithAi } from "@/lib/ai.functions";

type Msg = { role: "user" | "assistant"; content: string };

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const chat = useServerFn(chatWithAi);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { content } = await chat({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: content || "(sem resposta)" }]);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao falar com a IA");
      setMessages(messages);
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir assistente de IA"
        className="fixed z-40 bottom-20 left-4 md:bottom-6 md:right-6 md:left-auto h-12 w-12 rounded-full bg-gradient-brand text-white shadow-lg grid place-items-center hover:scale-105 transition-transform"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex md:items-end md:justify-end">
          <button
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative ml-auto w-full md:w-[420px] h-full md:h-[640px] md:m-4 md:rounded-2xl bg-background border border-border/60 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 h-12 border-b border-border/60">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-[oklch(0.78_0.16_250)]" />
                Assistente IA
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 grid place-items-center rounded-md hover:bg-surface text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">
                  <p>Pergunte qualquer coisa: prontuário, anamnese, técnicas, manejo de caso, dúvidas do app…</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-[oklch(0.55_0.22_260)] text-white"
                      : "mr-auto bg-surface border border-border/60"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
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
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte algo…"
                className="flex-1 h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-10 w-10 grid place-items-center rounded-lg bg-gradient-brand text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
