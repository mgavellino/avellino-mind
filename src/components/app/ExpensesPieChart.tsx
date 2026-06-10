import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

type Expense = { category: string | null; amount_cents: number; paid_at: string };

const PALETTE = [
  "oklch(0.65 0.18 250)",
  "oklch(0.70 0.16 180)",
  "oklch(0.72 0.18 60)",
  "oklch(0.65 0.20 25)",
  "oklch(0.68 0.18 320)",
  "oklch(0.65 0.16 140)",
  "oklch(0.70 0.14 290)",
  "oklch(0.60 0.12 30)",
];

const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ExpensesPieChart({ expenses }: { expenses: Expense[] }) {
  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      const c = e.category ?? "Outros";
      totals[c] = (totals[c] ?? 0) + e.amount_cents;
    }
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 text-center">
        <PieIcon className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Sem despesas no período.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-5">
      <div className="flex items-center gap-2 mb-3">
        <PieIcon className="h-4 w-4 text-brand" />
        <h3 className="text-sm font-medium">Despesas por categoria</h3>
      </div>
      <div className="grid sm:grid-cols-[160px_1fr] gap-4 items-center">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={36} outerRadius={64} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => brl(v)}
                contentStyle={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-1.5 text-xs">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              <span className="flex-1 truncate">{d.name}</span>
              <span className="text-muted-foreground">{((d.value / total) * 100).toFixed(0)}%</span>
              <span className="font-medium tabular-nums">{brl(d.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
