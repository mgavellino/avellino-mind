import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const METHOD_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  transferencia: "Transferência",
};

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const extenso = (cents: number) => {
  // Simples: só BRL formatado por extenso aproximado (versão leve)
  const value = (cents / 100).toFixed(2);
  return `(${value.replace(".", " reais e ")} centavos)`;
};

export type ReceiptData = {
  receiptNumber: string;
  patientName: string;
  patientCpf?: string;
  professionalName: string;
  crp?: string;
  cpfCnpj?: string;
  amountCents: number;
  paymentMethod: string;
  paidAt: string | Date;
  sessionDate?: string | Date;
  description?: string;
  address?: string;
};

export function generateReceipt(data: ReceiptData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 22;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(46, 110, 110);
  doc.text("RECIBO", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Nº ${data.receiptNumber}`, pageWidth / 2, y, { align: "center" });

  y += 8;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Valor destacado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(46, 110, 110);
  doc.text(brl(data.amountCents), pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120);
  doc.text(extenso(data.amountCents), pageWidth / 2, y, { align: "center" });

  y += 14;

  // Corpo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40);
  const corpo =
    `Recebi de ${data.patientName}${data.patientCpf ? ` (CPF ${data.patientCpf})` : ""}, ` +
    `a importância de ${brl(data.amountCents)}, ` +
    `referente a ${data.description ?? "atendimento psicológico"}` +
    `${data.sessionDate ? ` realizado em ${format(new Date(data.sessionDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}` : ""}, ` +
    `pago via ${METHOD_LABEL[data.paymentMethod] ?? data.paymentMethod}. ` +
    `Para clareza, firmo o presente recibo.`;

  const lines = doc.splitTextToSize(corpo, pageWidth - margin * 2);
  doc.text(lines, margin, y);
  y += lines.length * 6 + 16;

  // Local / data
  doc.setFontSize(10);
  doc.text(
    `${data.address ?? "São Paulo"}, ${format(new Date(data.paidAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}.`,
    margin,
    y,
  );

  y += 28;

  // Assinatura
  doc.setDrawColor(80);
  doc.line(margin + 30, y, pageWidth - margin - 30, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40);
  doc.text(data.professionalName, pageWidth / 2, y, { align: "center" });
  if (data.crp || data.cpfCnpj) {
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110);
    const parts = [];
    if (data.crp) parts.push(`CRP ${data.crp}`);
    if (data.cpfCnpj) parts.push(`CPF/CNPJ ${data.cpfCnpj}`);
    doc.text(parts.join(" · "), pageWidth / 2, y, { align: "center" });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(180);
  doc.text(
    "Documento emitido eletronicamente. Válido sem assinatura física.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  );

  return doc;
}

export function shortReceiptNumber(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `${yyyy}${mm}-${rand}`;
}
