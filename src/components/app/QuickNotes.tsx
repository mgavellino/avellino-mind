import { useEffect, useState } from "react";
import { Plus, Check, Trash2, StickyNote, AlertCircle } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Note = {
  id: string;
  content: string;
  priority: "low" | "normal" | "high";
  due_at: string | null;
  done: boolean;
  created_at: string;
};

const PRIORITY_META = {
  high: { label: "Alta", cls: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
  normal: { label: "Normal", cls: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  low: { label: "Baixa", cls: "border-border/60 bg-surface text-muted-foreground" },
} as const;

export function QuickNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<Note["priority"]>("normal");
  const [dueAt, setDueAt] = useState("");
  const [showDone, setShowDone] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("quick_notes")
      .select("*")
      .order("done", { ascending: true })
      .order("priority", { ascending: false })
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    setNotes((data as Note[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const add = async () => {
    if (!user || !content.trim()) return;
    const { error } = await supabase.from("quick_notes").insert({
      owner_id: user.id,
      content: content.trim(),
      priority,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Lembrete criado");
    setContent("");
    setDueAt("");
    setPriority("normal");
    setOpen(false);
    load();
  };

  const toggle = async (n: Note) => {
    const { error } = await supabase
      .from("quick_notes")
      .update({ done: !n.done })
      .eq("id", n.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("quick_notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const visible = notes.filter((n) => (showDone ? true : !n.done));
  const pendingCount = notes.filter((n) => !n.done).length;

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-medium">Lembretes</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-elevated text-muted-foreground">
            {pendingCount}
          </span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90"
        >
          <Plus className="h-3 w-3" />
          Novo
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-xl border border-border/60 bg-background p-3 space-y-2">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Ex: Ligar pra Maria pra remarcar..."
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border/60 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Note["priority"])}
              className="h-8 px-2 rounded-lg bg-surface border border-border/60 text-xs"
            >
              <option value="low">Baixa</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
            </select>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="h-8 px-2 rounded-lg bg-surface border border-border/60 text-xs"
            />
            <div className="flex-1" />
            <button
              onClick={() => setOpen(false)}
              className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={add}
              disabled={!content.trim()}
              className="h-8 px-3 rounded-lg bg-brand text-primary-foreground text-xs font-medium disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-1.5">
        {loading ? (
          <div className="text-center text-xs text-muted-foreground py-6">Carregando...</div>
        ) : visible.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-6">
            {showDone ? "Sem lembretes." : "Tudo em dia ✓"}
          </div>
        ) : (
          visible.map((n) => {
            const meta = PRIORITY_META[n.priority];
            const overdue = n.due_at && !n.done && isPast(parseISO(n.due_at));
            return (
              <div
                key={n.id}
                className={`group flex items-start gap-2 p-2.5 rounded-lg border bg-background/40 ${
                  n.done ? "opacity-50" : ""
                } ${overdue ? "border-red-500/40 bg-red-500/5" : "border-border/40"}`}
              >
                <button
                  onClick={() => toggle(n)}
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 transition-colors ${
                    n.done
                      ? "bg-brand border-brand grid place-items-center"
                      : "border-border hover:border-brand"
                  }`}
                  aria-label="Marcar como feito"
                >
                  {n.done && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm leading-snug ${n.done ? "line-through" : ""}`}>
                    {n.content}
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {n.priority !== "low" && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${meta.cls}`}>
                        {meta.label}
                      </span>
                    )}
                    {n.due_at && (
                      <span
                        className={`text-[10px] inline-flex items-center gap-1 ${
                          overdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                        }`}
                      >
                        {overdue && <AlertCircle className="h-3 w-3" />}
                        {format(parseISO(n.due_at), "dd MMM HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => remove(n.id)}
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 grid place-items-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                  aria-label="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {notes.some((n) => n.done) && (
        <button
          onClick={() => setShowDone((v) => !v)}
          className="mt-3 text-[11px] text-muted-foreground hover:text-foreground"
        >
          {showDone ? "Ocultar concluídos" : `Mostrar concluídos (${notes.filter((n) => n.done).length})`}
        </button>
      )}
    </div>
  );
}
