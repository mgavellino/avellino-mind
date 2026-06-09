import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Phone, Mail, Trash2, ArrowUpRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { waLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/app/lista-espera")({
  component: WaitingListPage,
});

type Entry = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  priority: string;
  notes: string | null;
  status: string;
  created_at: string;
};

const PRIORITY_LABEL: Record<string, { label: string; cls: string }> = {
  high: { label: "Alta", cls: "bg-red-500/10 text-red-600 border-red-500/30" },
  normal: { label: "Normal", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  low: { label: "Baixa", cls: "bg-muted text-muted-foreground border-border/60" },
};

function WaitingListPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Entry[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    priority: "normal",
    notes: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("waiting_list")
      .select("*")
      .eq("status", "waiting")
      .order("created_at", { ascending: false });
    setList((data ?? []) as unknown as Entry[]);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const add = async () => {
    if (!user) return;
    if (!form.full_name.trim()) return toast.error("Nome é obrigatório");
    const { error } = await supabase.from("waiting_list").insert({
      owner_id: user.id,
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      priority: form.priority,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Adicionada à lista");
    setForm({ full_name: "", phone: "", email: "", priority: "normal", notes: "" });
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover da lista?")) return;
    await supabase.from("waiting_list").delete().eq("id", id);
    load();
  };

  const convert = async (e: Entry) => {
    if (!user) return;
    if (!confirm(`Converter ${e.full_name} em paciente ativa?`)) return;
    const { error } = await supabase.from("patients").insert({
      owner_id: user.id,
      full_name: e.full_name,
      phone: e.phone,
      email: e.email,
      is_active: true,
      notes: e.notes,
    });
    if (error) return toast.error(error.message);
    await supabase.from("waiting_list").update({ status: "converted" }).eq("id", e.id);
    toast.success(`${e.full_name} cadastrada`);
    load();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Lista de espera</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pessoas aguardando vaga. Converta em paciente quando abrir horário.
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </div>

      {open && (
        <div className="rounded-2xl border border-border/60 bg-surface/40 p-4 mb-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Nome completo *</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Telefone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Prioridade</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            >
              <option value="high">Alta</option>
              <option value="normal">Normal</option>
              <option value="low">Baixa</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm resize-none"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-lg text-sm text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={add}
              className="h-10 px-5 rounded-lg bg-brand text-primary-foreground text-sm font-medium"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border/60 bg-surface/40 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Sua lista de espera está vazia.
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {list.map((e) => {
              const meta = PRIORITY_LABEL[e.priority] ?? PRIORITY_LABEL.normal;
              return (
                <li key={e.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{e.full_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        {e.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {e.phone}
                          </span>
                        )}
                        {e.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {e.email}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(e.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {e.notes && <div className="text-xs mt-1.5 text-muted-foreground">{e.notes}</div>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {e.phone && (() => {
                      const link = waLink(e.phone, `Oi, ${e.full_name.split(" ")[0]}! Abriu uma vaga aqui no consultório. Te interessa?`);
                      return link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        >
                          WhatsApp
                        </a>
                      ) : null;
                    })()}
                    <button
                      onClick={() => convert(e)}
                      className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md text-xs bg-foreground text-background"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Converter
                    </button>
                    <button
                      onClick={() => remove(e.id)}
                      className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
