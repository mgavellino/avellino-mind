import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Clock4, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/app/bloqueios")({
  component: BlocksPage,
});

type Block = {
  id: string;
  title: string;
  weekday: number;
  start_time: string;
  end_time: string;
  color: string | null;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const COLORS = ["#94a3b8", "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#ef4444"];

function BlocksPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Block[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Block | null>(null);
  const [form, setForm] = useState({
    title: "Almoço",
    weekday: 1,
    start_time: "12:00",
    end_time: "13:00",
    color: COLORS[0],
  });

  const load = async () => {
    const { data } = await supabase
      .from("recurring_blocks")
      .select("*")
      .order("weekday")
      .order("start_time");
    setList((data ?? []) as unknown as Block[]);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const startEdit = (b: Block | null) => {
    setEditing(b);
    setForm({
      title: b?.title ?? "Almoço",
      weekday: b?.weekday ?? 1,
      start_time: (b?.start_time ?? "12:00").slice(0, 5),
      end_time: (b?.end_time ?? "13:00").slice(0, 5),
      color: b?.color ?? COLORS[0],
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.title.trim()) return toast.error("Título obrigatório");
    const payload = {
      title: form.title.trim(),
      weekday: form.weekday,
      start_time: form.start_time + ":00",
      end_time: form.end_time + ":00",
      color: form.color,
    };
    if (editing) {
      const { error } = await supabase.from("recurring_blocks").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("recurring_blocks").insert({ ...payload, owner_id: user.id });
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover bloqueio?")) return;
    await supabase.from("recurring_blocks").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Bloqueios recorrentes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Almoço, supervisão, terapia pessoal — horários que se repetem toda semana.
          </p>
        </div>
        <button
          onClick={() => startEdit(null)}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Novo bloqueio
        </button>
      </div>

      {open && (
        <div className="rounded-2xl border border-border/60 bg-surface/40 p-4 mb-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Título</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Dia da semana</label>
            <select
              value={form.weekday}
              onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            >
              {WEEKDAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Início</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fim</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Cor</label>
            <div className="mt-1 flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-8 w-8 rounded-full border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
              className="h-10 px-4 rounded-lg text-sm text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              className="h-10 px-5 rounded-lg bg-brand text-primary-foreground text-sm font-medium"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-surface/40 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Clock4 className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            Nenhum bloqueio cadastrado.
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {list.map((b) => (
              <li key={b.id} className="p-4 flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ background: b.color ?? "#94a3b8" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{b.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {WEEKDAYS[b.weekday]} · {b.start_time.slice(0, 5)} — {b.end_time.slice(0, 5)}
                  </div>
                </div>
                <button
                  onClick={() => startEdit(b)}
                  className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(b.id)}
                  className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
