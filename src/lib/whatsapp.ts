import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // Se não tem DDI, assume Brasil (55)
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
  return digits;
}

export function waLink(phone: string | null | undefined, message: string): string | null {
  const num = normalizePhone(phone);
  if (!num) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function reminderMessage(opts: {
  patientName: string;
  startsAt: string | Date;
  professionalName?: string;
  address?: string;
}): string {
  const start = typeof opts.startsAt === "string" ? new Date(opts.startsAt) : opts.startsAt;
  const dateStr = format(start, "EEEE, d 'de' MMMM", { locale: ptBR });
  const timeStr = format(start, "HH:mm");
  const greeting = `Oi, ${opts.patientName.split(" ")[0]}!🙂`;
  const body = `Está confirmado nossa sessão de ${dateStr} às ${timeStr}?`;
  return `${greeting}\n\n${body}`;
}

export function confirmationMessage(opts: {
  patientName: string;
  startsAt: string | Date;
}): string {
  const start = typeof opts.startsAt === "string" ? new Date(opts.startsAt) : opts.startsAt;
  const dateStr = format(start, "EEEE, d 'de' MMM 'às' HH'h'mm", { locale: ptBR });
  return `Oi, ${opts.patientName.split(" ")[0]}! Confirma pra mim nossa sessão de ${dateStr}? 🙂`;
}
