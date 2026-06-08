import { useEffect, useState } from "react";
import { Check, ChevronRight, X, User, DollarSign, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Step = 0 | 1 | 2 | 3;

export function OnboardingDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);

  // step 0 — perfil
  const [fullName, setFullName] = useState("");
  const [crp, setCrp] = useState("");
  const [phone, setPhone] = useState("");
  // step 1 — preço
  const [price, setPrice] = useState("");
  // step 2 — paciente
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, crp, phone, default_session_price_cents, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as {
          full_name?: string;
          crp?: string;
          phone?: string;
          default_session_price_cents?: number;
          onboarding_completed?: boolean;
        } | null;
        if (!p || p.onboarding_completed) return;
        setFullName(p.full_name ?? user.user_metadata?.full_name ?? "");
        setCrp(p.crp ?? "");
        setPhone(p.phone ?? "");
        if (p.default_session_price_cents) setPrice(String(p.default_session_price_cents / 100));
        setOpen(true);
      });
  }, [user]);

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);
    setSaving(false);
    setOpen(false);
    toast.success("Tudo pronto. Bem-vinda ao seu consultório.");
  };

  const saveStep = async (): Promise<boolean> => {
    if (!user) return false;
    setSaving(true);
    if (step === 0) {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          crp: crp.trim() || null,
          phone: phone.trim() || null,
        })
        .eq("id", user.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return false;
      }
    } else if (step === 1) {
      const cents = price ? Math.round(parseFloat(price.replace(",", ".")) * 100) : null;
      if (price && (Number.isNaN(cents) || (cents ?? 0) < 0)) {
        toast.error("Valor inválido");
        setSaving(false);
        return false;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ default_session_price_cents: cents ?? 0 })
        .eq("id", user.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return false;
      }
    } else if (step === 2) {
      if (patientName.trim()) {
        const { error } = await supabase.from("patients").insert({
          owner_id: user.id,
          full_name: patientName.trim(),
          phone: patientPhone.trim() || null,
          is_active: true,
        });
        if (error) {
          toast.error(error.message);
          setSaving(false);
          return false;
        }
        toast.success(`${patientName} cadastrada!`);
      }
    }
    setSaving(false);
    return true;
  };

  const next = async () => {
    const ok = await saveStep();
    if (!ok) return;
    if (step < 3) setStep((s) => (s + 1) as Step);
    else finish();
  };

  if (!open) return null;

  const steps = [
    { icon: User, title: "Seu perfil", desc: "Pra personalizar o app" },
    { icon: DollarSign, title: "Valor da sessão", desc: "Aplicado nos recebíveis" },
    { icon: Users, title: "Primeira paciente", desc: "Comece o seu cadastro" },
    { icon: Sparkles, title: "Pronto!", desc: "Conheça os atalhos" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={finish}
          className="absolute top-3 right-3 h-8 w-8 grid place-items-center rounded-md hover:bg-surface text-muted-foreground z-10"
          aria-label="Pular"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2 mb-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-brand" : "bg-border/60"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand/15 border border-brand/30 grid place-items-center">
              {(() => {
                const Icon = steps[step].icon;
                return <Icon className="h-5 w-5 text-brand" />;
              })()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{steps[step].title}</h2>
              <p className="text-xs text-muted-foreground">{steps[step].desc}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-3 min-h-[280px]">
          {step === 0 && (
            <>
              <div>
                <label className="text-xs text-muted-foreground">Nome completo</label>
                <input
                  autoFocus
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aline Dias"
                  className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">CRP</label>
                <input
                  value={crp}
                  onChange={(e) => setCrp(e.target.value)}
                  placeholder="06/12345"
                  className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Telefone (WhatsApp)</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">
                Quanto você cobra por sessão? Vai entrar como valor padrão nas suas consultas.
              </p>
              <div>
                <label className="text-xs text-muted-foreground">Valor padrão</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <input
                    autoFocus
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="200,00"
                    className="flex-1 h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Pode editar a qualquer momento em Financeiro.
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-muted-foreground">
                Cadastre sua 1ª paciente agora (ou pule e cadastre depois).
              </p>
              <div>
                <label className="text-xs text-muted-foreground">Nome da paciente</label>
                <input
                  autoFocus
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Maria Silva"
                  className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Telefone (opcional)</label>
                <input
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="mt-1 w-full h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm">
                Tudo pronto, <strong>{fullName.split(" ")[0] || "Aline"}</strong> ✨
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                  <span>
                    Use a <strong>Agenda</strong> pra marcar consultas.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                  <span>
                    Cada consulta finalizada vira um <strong>recebível</strong> no Financeiro.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                  <span>
                    Anote evoluções em <strong>Prontuários</strong> com modelos prontos.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-brand mt-0.5 shrink-0" />
                  <span>
                    Use o <strong>Assistente IA</strong> (botão no topo) pra agendar, redigir
                    evoluções e tirar dúvidas clínicas.
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between">
          <button
            onClick={finish}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Pular tudo
          </button>
          <button
            onClick={next}
            disabled={saving}
            className="inline-flex items-center gap-1 h-10 px-5 rounded-lg bg-brand text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {step === 3 ? "Começar" : "Próximo"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
