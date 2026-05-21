import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/cupons")({
  component: AdminCoupons,
});

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_redemptions: number | null;
  redemptions_count: number;
  expires_at: string | null;
  is_active: boolean;
};

const empty = {
  code: "",
  description: "",
  discount_type: "percent" as const,
  discount_value: 10,
  max_redemptions: null as number | null,
  expires_at: null as string | null,
  is_active: true,
};

function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data as unknown as Coupon[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code) return toast.error("Defina um código");
    setSaving(true);
    const payload = {
      ...form,
      code: form.code.toUpperCase().trim(),
      discount_value: form.discount_type === "fixed"
        ? Math.round(form.discount_value * 100)
        : form.discount_value,
    };
    const { error } = await supabase.from("coupons").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Cupom criado");
    setForm(empty);
    load();
  };

  const toggle = async (c: Coupon) => {
    await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Excluir cupom?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold tracking-tight">Cupons</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cupons aplicáveis no checkout. % de desconto ou valor fixo (R$).
      </p>

      <div className="mt-8 rounded-2xl border border-border/60 bg-surface/40 p-6">
        <h2 className="text-sm font-semibold mb-4">Novo cupom</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            placeholder="LANCAMENTO30"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className={input}
          />
          <select
            value={form.discount_type}
            onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })}
            className={input}
          >
            <option value="percent">% desconto</option>
            <option value="fixed">R$ fixo</option>
          </select>
          <input
            type="number"
            placeholder={form.discount_type === "percent" ? "10" : "50.00"}
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value || "0") })}
            className={input}
          />
          <input
            type="number"
            placeholder="Limite (opcional)"
            value={form.max_redemptions ?? ""}
            onChange={(e) => setForm({ ...form, max_redemptions: e.target.value ? parseInt(e.target.value) : null })}
            className={input}
          />
          <input
            placeholder="Descrição (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${input} sm:col-span-2`}
          />
          <input
            type="date"
            value={form.expires_at?.slice(0, 10) ?? ""}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className={input}
          />
          <button
            onClick={create}
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Criar cupom
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-surface/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Código</th>
              <th className="text-left px-4 py-3">Desconto</th>
              <th className="text-left px-4 py-3">Usos</th>
              <th className="text-left px-4 py-3">Expira</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-border/40">
                <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                <td className="px-4 py-3">
                  {c.discount_type === "percent" ? `${c.discount_value}%` : `R$ ${(c.discount_value / 100).toFixed(2)}`}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.redemptions_count}{c.max_redemptions ? `/${c.max_redemptions}` : ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(c)} className={`text-xs px-2 py-1 rounded-md border ${c.is_active ? "border-[oklch(0.55_0.22_155)]/40 text-[oklch(0.72_0.18_155)]" : "border-border/60 text-muted-foreground"}`}>
                    {c.is_active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(c.id)} className="text-xs text-destructive hover:opacity-80">
                    <Trash2 className="h-3.5 w-3.5 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">Nenhum cupom criado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const input = "h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";
