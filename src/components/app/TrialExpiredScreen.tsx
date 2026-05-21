import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";

export function TrialExpiredScreen() {
  const { signOut } = useAuth();
  const { limits } = usePlan();
  const wasTrial = limits.status === "trial";

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-4">
      <div className="max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-border mb-5">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {wasTrial ? "Seu teste grátis acabou" : "Assinatura necessária"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {wasTrial
            ? "Pra continuar usando o Avell, escolha um plano. Seus dados estão preservados."
            : "Você precisa de uma assinatura ativa pra acessar o app."}
        </p>
        <Link
          to="/"
          hash="pricing"
          className="mt-6 inline-flex h-11 px-6 items-center rounded-lg bg-gradient-brand text-white text-sm font-medium hover:opacity-90"
        >
          Ver planos
        </Link>
        <button
          onClick={signOut}
          className="mt-3 ml-3 inline-flex h-11 px-5 items-center rounded-lg border border-border text-sm hover:bg-surface"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
