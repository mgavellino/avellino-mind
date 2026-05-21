import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white mb-5">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Pagamento confirmado</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {session_id
            ? "Recebemos seu pagamento. Seu plano será liberado em alguns segundos."
            : "Sessão não encontrada."}
        </p>
        <Link
          to="/app"
          className="mt-6 inline-flex h-10 px-5 items-center rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90"
        >
          Ir para o app
        </Link>
      </div>
    </div>
  );
}
