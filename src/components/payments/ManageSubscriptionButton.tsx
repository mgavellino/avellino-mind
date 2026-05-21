import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { usePlan } from "@/hooks/use-plan";

export function ManageSubscriptionButton() {
  const { limits } = usePlan();
  const openPortal = useServerFn(createPortalSession);
  const [loading, setLoading] = useState(false);

  if (!limits.stripe_customer_id) return null;

  const onClick = async () => {
    setLoading(true);
    try {
      const url = await openPortal({
        data: {
          returnUrl: `${window.location.origin}/app/financeiro`,
          environment: getStripeEnvironment(),
        },
      });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao abrir portal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs hover:bg-surface disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
      Gerenciar assinatura
    </button>
  );
}
