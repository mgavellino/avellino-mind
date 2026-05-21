import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/precos")({
  component: AdminPlans,
});

type Plan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  promo_price_cents: number | null;
  interval: string;
  max_installments: number | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  max_patients: number | null;
  features: string[];
};

function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("plans").select("*").order("sort_order");
    setPlans((data as unknown as Plan[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const update = (id: string, patch: Partial<Plan>) =>
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const save = async (plan: Plan) => {
    setSavingId(plan.id);
    const { error } = await supabase
      .from("plans")
      .update({
        name: plan.name,
        description: plan.description,
        price_cents: plan.price_cents,
        promo_price_cents: plan.promo_price_cents,
        max_installments: plan.max_installments,
        is_featured: plan.is_featured,
        is_active: plan.is_active,
        max_patients: plan.max_patients,
        features: plan.features,
      })
      .eq("id", plan.id);
    setSavingId(null);
    if (error) toast.error(error.message);
    else toast.success(`${plan.name} atualizado`);
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold tracking-tight">Preços e planos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Edite valores, parcelas, recursos e disponibilidade. Os planos são refletidos
        imediatamente na landing.
      </p>

      <div className="mt-8 space-y-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-border/60 bg-surface/40 p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {plan.slug}
                </div>
                <input
                  value={plan.name}
                  onChange={(e) => update(plan.id, { name: e.target.value })}
                  className="mt-1 bg-transparent text-xl font-semibold tracking-tight focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={plan.is_featured}
                    onChange={(e) => update(plan.id, { is_featured: e.target.checked })}
                  />
                  Destaque
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={plan.is_active}
                    onChange={(e) => update(plan.id, { is_active: e.target.checked })}
                  />
                  Ativo
                </label>
                <button
                  onClick={() => save(plan)}
                  disabled={savingId === plan.id}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {savingId === plan.id ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              <Field label="Preço (R$)">
                <input
                  type="number"
                  step="0.01"
                  value={(plan.price_cents / 100).toFixed(2)}
                  onChange={(e) =>
                    update(plan.id, {
                      price_cents: Math.round(parseFloat(e.target.value || "0") * 100),
                    })
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Preço promocional (R$)">
                <input
                  type="number"
                  step="0.01"
                  placeholder="vazio = sem promo"
                  value={plan.promo_price_cents != null ? (plan.promo_price_cents / 100).toFixed(2) : ""}
                  onChange={(e) =>
                    update(plan.id, {
                      promo_price_cents: e.target.value
                        ? Math.round(parseFloat(e.target.value) * 100)
                        : null,
                    })
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Parcelas máx.">
                <input
                  type="number"
                  value={plan.max_installments ?? 1}
                  onChange={(e) =>
                    update(plan.id, { max_installments: parseInt(e.target.value || "1") })
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Máx. pacientes (vazio = ilimitado)">
                <input
                  type="number"
                  value={plan.max_patients ?? ""}
                  onChange={(e) =>
                    update(plan.id, {
                      max_patients: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Descrição">
                <input
                  value={plan.description ?? ""}
                  onChange={(e) => update(plan.id, { description: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Benefícios (um por linha)">
                <textarea
                  rows={5}
                  value={(plan.features ?? []).join("\n")}
                  onChange={(e) =>
                    update(plan.id, {
                      features: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  className={`${inputCls} resize-none py-2`}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
