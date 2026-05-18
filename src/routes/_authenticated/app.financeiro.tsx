import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/financeiro")({
  component: () => (
    <div className="max-w-2xl mx-auto pt-20 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white mb-5">
        <CreditCard className="h-6 w-6" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Financeiro</h1>
      <p className="mt-3 text-muted-foreground">
        Faturamento, pagamentos Mercado Pago e relatórios. Em desenvolvimento.
      </p>
    </div>
  ),
});
