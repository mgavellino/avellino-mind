import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ReportData = {
  monthLabel: string;
  professional: string;
  crp?: string;
  receivedCents: number;
  expensesCents: number;
  profitCents: number;
  toReceiveCents: number;
  appointmentsCount: number;
  byMethod: { method: string; total: number }[];
  expensesByCategory: { category: string; total: number }[];
  topPatients: { name: string; total: number }[];
  previousProfitCents?: number;
};

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const METHOD_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão Crédito",
  cartao_debito: "Cartão Débito",
  transferencia: "Transferência",
};

export function generateMonthlyReport(data: ReportData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 18;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(46, 110, 110);
  doc.text(data.professional, margin, y);
  if (data.crp) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`CRP ${data.crp}`, margin, y + 5);
  }
  doc.setTextColor(80);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Gerado em ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
    pageWidth - margin,
    y,
    { align: "right" },
  );

  y += 16;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40);
  doc.text(`Relatório financeiro — ${data.monthLabel}`, margin, y);
  y += 10;

  // KPIs grid
  const kpis = [
    { label: "Recebido", value: brl(data.receivedCents), color: [16, 185, 129] },
    { label: "Despesas", value: brl(data.expensesCents), color: [220, 38, 38] },
    { label: "Lucro", value: brl(data.profitCents), color: [46, 110, 110] },
    { label: "A receber", value: brl(data.toReceiveCents), color: [217, 119, 6] },
  ];
  const kpiWidth = (pageWidth - margin * 2 - 9) / 4;
  kpis.forEach((k, i) => {
    const x = margin + i * (kpiWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226);
    doc.roundedRect(x, y, kpiWidth, 22, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.setFont("helvetica", "normal");
    doc.text(k.label.toUpperCase(), x + 3, y + 6);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(k.color[0], k.color[1], k.color[2]);
    doc.text(k.value, x + 3, y + 15);
  });
  y += 30;

  // Comparativo
  if (typeof data.previousProfitCents === "number") {
    const diff = data.profitCents - data.previousProfitCents;
    const sign = diff >= 0 ? "▲" : "▼";
    const pct =
      data.previousProfitCents !== 0
        ? `${((diff / Math.abs(data.previousProfitCents)) * 100).toFixed(1)}%`
        : "—";
    doc.setFontSize(9);
    doc.setTextColor(diff >= 0 ? 16 : 220, diff >= 0 ? 185 : 38, diff >= 0 ? 129 : 38);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${sign} ${brl(Math.abs(diff))} (${pct}) vs mês anterior`,
      margin,
      y,
    );
    y += 8;
  }

  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Consultas realizadas: ${data.appointmentsCount}`, margin, y);
  y += 8;

  // Por método
  if (data.byMethod.length) {
    autoTable(doc, {
      startY: y,
      head: [["Método de pagamento", "Total recebido"]],
      body: data.byMethod.map((m) => [METHOD_LABEL[m.method] ?? m.method, brl(m.total)]),
      theme: "striped",
      headStyles: { fillColor: [46, 110, 110], textColor: 255 },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Despesas
  if (data.expensesByCategory.length) {
    autoTable(doc, {
      startY: y,
      head: [["Despesa por categoria", "Total"]],
      body: data.expensesByCategory.map((e) => [e.category, brl(e.total)]),
      theme: "striped",
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Top pacientes
  if (data.topPatients.length) {
    autoTable(doc, {
      startY: y,
      head: [["Top pacientes (por receita)", "Total"]],
      body: data.topPatients.map((p) => [p.name, brl(p.total)]),
      theme: "striped",
      headStyles: { fillColor: [217, 119, 6], textColor: 255 },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(160);
  doc.text(
    "Documento sigiloso — uso exclusivo do consultório.",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" },
  );

  return doc;
}
