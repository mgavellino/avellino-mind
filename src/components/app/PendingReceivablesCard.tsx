import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Wallet, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Row = {
  id: string;
  amount_cents: number;
  due_at: string;
  patient_id: string | null;
  status: string;
  patient_name?: string;
};

export function PendingReceivablesCard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("appointment_receivables")
        .select("id, amount_cents, due_at, patient_id, status")
        .in("status", ["pending", "overdue"])
        .order("due_at", { ascending: true })
        .limit(8);
      const list = (data ?? []) as Row[];
      const pids = Array.from(new Set(list.map((r) => r.patient_id).filter(Boolean) as string[]));
      if (pids.length) {
        const { data: ps } = await supabase.from("patients").select("id, full_name").in("id", pids);
        const map: Record<string, string> = {};
        for (const p of (ps ?? []) as { id: string; full_name: string }[]) map[p.id] = p.full_name;
        for (const r of list) if (r.patient_id) r.patient_name = map[r.patient_id];
      }
      setRows(list);
      setLoading(false);
    })();
  }, [user]);

  const total = rows.reduce((s, r) => s + (r.amount_cents ?? 0), 0);
  const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-medium">A receber</h2>
        </div>
        <Link to="/app/financeiro" className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
          Financeiro <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {!loading && rows.length > 0 && (
        <div className="mt-3 text-2xl font-semibold tracking-tight">{brl(total)}</div>
      )}
      <div className="mt-3 space-y-1.5">
        {loading ? (
          <div className="text-center text-xs text-muted-foreground py-4">...</div>
        ) : rows.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-4">Tudo em dia ✓</div>
        ) : (
          rows.map((r) => {
            const overdue = parseISO(r.due_at) < new Date();
            return (
              <Link
                key={r.id}
                to="/app/financeiro"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{r.patient_name ?? "Consulta"}</div>
                  <div className={`text-[10px] ${overdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                    {overdue ? "vencido · " : ""}
                    {format(parseISO(r.due_at), "dd MMM", { locale: ptBR })}
                  </div>
                </div>
                <div className="text-sm font-medium">{brl(r.amount_cents)}</div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
