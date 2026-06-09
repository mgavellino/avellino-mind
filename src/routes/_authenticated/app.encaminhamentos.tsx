import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Phone, Mail, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/app/encaminhamentos")({
  component: ReferralsPage,
});

type Referral = {
  id: string;
  full_name: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  crp: string | null;
  notes: string | null;
};

function ReferralsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Referral[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Referral | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    specialty: "",
    phone: "",
    email: "",
    crp: "",
    notes: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("referrals")
      .select("*")
      .order("full_name");
    setList((data ?? []) as unknown as Referral[]);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const startEdit = (r: Referral | null) => {
    setEditing(r);
    setForm({
      full_name: r?.full_name ?? "",
      specialty: r?.specialty ?? "",
      phone: r?.phone ?? "",
      email: r?.email ?? "",
      crp: r?.crp ?? "",
      notes: r?.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.full_name.trim()) return toast.error("Nome é obrigatório");
    const payload = {
      full_name: form.full_name.trim(),
      specialty: form.specialty || null,
      phone: form.phone || null,
      email: form.email || null,
      crp: form.crp || null,
      notes: form.notes || null,
    };
    if (editing) {
      const { error } = await supabase.from("referrals").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("referrals").insert({ ...payload, owner_id: user.id });
      if (error) return toast.error(error.message);
    }
    toast.success("Salvo");
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover contato?")) return;
    await supabase.from("referrals").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Encaminhamentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua rede de colegas para encaminhar pacientes com necessidades específicas.
          </p>
        </div>
        <button
          onClick={() => startEdit(null)}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Novo contato
        </button>
      </div>

      {open && (
        <div className="rounded-2xl border border-border/60 bg-surface/40 p-4 mb-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Nome *</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Especialidade</label>
            <input
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              placeholder="ex: psiquiatra, fonoaudiólogo, terapia de casal"
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">CRP / Registro</label>
            <input
              value={form.crp}
              onChange={(e) => setForm({ ...form, crp: e.target.value })}
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
            Nenhum contato cadastrado.
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {list.map((r) => (
              <li key={r.id} className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex gap-2 flex-wrap">
                    {r.specialty && <span>{r.specialty}</span>}
                    {r.crp && <span>CRP {r.crp}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex gap-2 flex-wrap">
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
                        <Phone className="h-3 w-3" />
                        {r.phone}
                      </a>
                    )}
                    {r.email && (
                      <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-3 w-3" />
                        {r.email}
                      </a>
                    )}
                  </div>
                  {r.notes && <div className="text-xs mt-1.5">{r.notes}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(r)}
                    className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
