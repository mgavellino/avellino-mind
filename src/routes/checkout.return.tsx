import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "confirmed" | "pending">("checking");
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      const { data } = await supabase.rpc("get_user_plan_limits", { _uid: user.id });
      const d = data as { has_access?: boolean; plan_name?: string; status?: string } | null;
      if (cancelled) return;
      if (d?.has_access && d.status !== "trial") {
        setStatus("confirmed");
        setPlanName(d.plan_name ?? null);
        return;
      }
      attempts++;
      if (attempts < 15) {
        setTimeout(poll, 1500);
      } else {
        setStatus("pending");
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div
          className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-5 ${
            status === "confirmed" ? "bg-gradient-brand text-white" : "bg-surface border border-border"
          }`}
        >
          {status === "checking" ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <CheckCircle2 className="h-7 w-7" />
          )}
        </div>

        {status === "checking" && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Confirmando pagamento…</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Isso leva alguns segundos. Não feche essa página.
            </p>
          </>
        )}

        {status === "confirmed" && (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Plano ativado</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {planName ? `${planName} liberado com sucesso.` : "Seu plano está ativo."}
            </p>
            <button
              onClick={() => navigate({ to: "/app" })}
              className="mt-6 inline-flex h-11 px-6 items-center rounded-lg bg-gradient-brand text-white text-sm font-medium hover:opacity-90"
            >
              Ir para o app
            </button>
          </>
        )}

        {status === "pending" && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Pagamento recebido</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {session_id
                ? "Estamos finalizando a liberação do plano. Em alguns minutos estará ativo no seu painel."
                : "Sessão não encontrada."}
            </p>
            <button
              onClick={() => navigate({ to: "/app" })}
              className="mt-6 inline-flex h-11 px-6 items-center rounded-lg bg-foreground text-background text-sm font-medium"
            >
              Ir para o app
            </button>
          </>
        )}
      </div>
    </div>
  );
}
