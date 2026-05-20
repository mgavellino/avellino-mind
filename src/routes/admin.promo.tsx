import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/promo")({
  component: AdminPromo,
});

type Promo = {
  active: boolean;
  title: string;
  text: string;
  badge: string;
};

const DEFAULT: Promo = {
  active: true,
  title: "Promoção de lançamento",
  text: "1º mês por R$ 697 · parcele em até 12x",
  badge: "por tempo limitado",
};

function AdminPromo() {
  const [promo, setPromo] = useState<Promo>(DEFAULT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "launch_promo")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setPromo({ ...DEFAULT, ...(data.value as Promo) });
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "launch_promo", value: promo as never });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Banner atualizado");
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Banner promocional</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Edite o banner exibido na seção de planos da landing.
      </p>

      <div className="mt-8 rounded-2xl border border-border/60 bg-surface/40 p-6 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={promo.active}
            onChange={(e) => setPromo({ ...promo, active: e.target.checked })}
          />
          <span>Mostrar banner na landing</span>
        </label>

        <Field label="Título">
          <input
            value={promo.title}
            onChange={(e) => setPromo({ ...promo, title: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Texto principal">
          <input
            value={promo.text}
            onChange={(e) => setPromo({ ...promo, text: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Etiqueta (canto direito)">
          <input
            value={promo.badge}
            onChange={(e) => setPromo({ ...promo, badge: e.target.value })}
            className={inputCls}
          />
        </Field>

        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Pré-visualização
        </div>
        <div className="rounded-2xl border border-[oklch(0.55_0.22_260)]/40 bg-gradient-to-r from-[oklch(0.55_0.22_260)]/10 to-[oklch(0.68_0.20_245)]/10 px-6 py-5 flex items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-gradient-brand grid place-items-center text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-semibold">{promo.title}</div>
              <div className="text-xs text-muted-foreground">{promo.text}</div>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[oklch(0.78_0.16_250)] border border-[oklch(0.55_0.22_260)]/40 rounded-full px-3 py-1">
            {promo.badge}
          </span>
        </div>
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
