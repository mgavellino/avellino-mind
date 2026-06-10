// Exporta dados financeiros do ano para o IR (Carnê-Leão / declaração anual).
import { format } from "date-fns";

type Receivable = {
  amount_cents: number;
  paid_at: string | null;
  payment_method: string | null;
  patient_id: string | null;
};
type Expense = { amount_cents: number; paid_at: string; category: string | null; description: string };

type PatientMap = Record<string, { full_name: string; cpf?: string | null }>;

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(";") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCSV(filename: string, rows: (string | number | null | undefined)[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(";")).join("\n");
  // BOM pra Excel reconhecer UTF-8
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportIRYearCSV(year: number, receivables: Receivable[], expenses: Expense[], patients: PatientMap) {
  // Receitas
  const recRows: (string | number)[][] = [
    ["Data", "Paciente", "CPF", "Valor (R$)", "Forma de pagamento"],
  ];
  for (const r of receivables) {
    if (!r.paid_at) continue;
    const d = new Date(r.paid_at);
    if (d.getFullYear() !== year) continue;
    const p = r.patient_id ? patients[r.patient_id] : undefined;
    recRows.push([
      format(d, "dd/MM/yyyy"),
      p?.full_name ?? "—",
      p?.cpf ?? "",
      (r.amount_cents / 100).toFixed(2).replace(".", ","),
      r.payment_method ?? "",
    ]);
  }
  downloadCSV(`IR-${year}-receitas.csv`, recRows);

  // Despesas
  const expRows: (string | number)[][] = [["Data", "Descrição", "Categoria", "Valor (R$)"]];
  for (const e of expenses) {
    const d = new Date(e.paid_at);
    if (d.getFullYear() !== year) continue;
    expRows.push([
      format(d, "dd/MM/yyyy"),
      e.description,
      e.category ?? "",
      (e.amount_cents / 100).toFixed(2).replace(".", ","),
    ]);
  }
  setTimeout(() => downloadCSV(`IR-${year}-despesas.csv`, expRows), 300);
}
