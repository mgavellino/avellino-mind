import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  AppointmentFormSheet,
  type Appointment,
} from "@/components/app/AppointmentFormSheet";
import type { Patient } from "@/components/app/PatientFormSheet";

export const Route = createFileRoute("/_authenticated/app/agenda")({
  component: AgendaPage,
});

const HOUR_START = 7;
const HOUR_END = 21;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

function AgendaPage() {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [initialDate, setInitialDate] = useState<Date | null>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(cursor, i)),
    [cursor],
  );

  const load = async () => {
    const from = days[0].toISOString();
    const to = addDays(days[6], 1).toISOString();
    const [a, p] = await Promise.all([
      supabase
        .from("appointments")
        .select("*")
        .gte("starts_at", from)
        .lt("starts_at", to)
        .order("starts_at"),
      supabase.from("patients").select("*").order("full_name"),
    ]);
    if (a.error) toast.error(a.error.message);
    else setAppointments((a.data ?? []) as Appointment[]);
    if (!p.error) setPatients((p.data ?? []) as Patient[]);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cursor]);

  const handleSlot = (day: Date, hour: number) => {
    const d = new Date(day);
    d.setHours(hour, 0, 0, 0);
    setEditing(null);
    setInitialDate(d);
    setOpen(true);
  };

  const handleAppointment = (a: Appointment) => {
    setEditing(a);
    setInitialDate(null);
    setOpen(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            {format(days[0], "d 'de' MMMM", { locale: ptBR })} —{" "}
            {format(days[6], "d 'de' MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border/60 bg-surface/40">
            <button
              onClick={() => setCursor(addWeeks(cursor, -1))}
              className="h-9 w-9 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-3 h-9 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border-x border-border/60"
            >
              Hoje
            </button>
            <button
              onClick={() => setCursor(addWeeks(cursor, 1))}
              className="h-9 w-9 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setInitialDate(new Date());
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background text-sm font-medium px-4 h-9 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Nova consulta
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface/30 overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/60 bg-surface/40 sticky top-0 z-10">
          <div />
          {days.map((d) => {
            const isToday = isSameDay(d, new Date());
            return (
              <div
                key={d.toISOString()}
                className="px-3 py-3 border-l border-border/40 text-center"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {format(d, "EEE", { locale: ptBR })}
                </div>
                <div
                  className={`mt-1 text-lg font-semibold ${
                    isToday ? "text-[oklch(0.68_0.20_245)]" : "text-foreground"
                  }`}
                >
                  {format(d, "d")}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          <div>
            {HOURS.map((h) => (
              <div
                key={h}
                className="h-16 border-b border-border/30 text-[10px] text-muted-foreground pr-2 text-right pt-1"
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {days.map((d) => {
            const dayApps = appointments.filter((a) =>
              isSameDay(parseISO(a.starts_at), d),
            );
            return (
              <div key={d.toISOString()} className="relative border-l border-border/40">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    onClick={() => handleSlot(d, h)}
                    className="block w-full h-16 border-b border-border/30 hover:bg-surface/60 transition-colors"
                  />
                ))}
                {dayApps.map((a) => {
                  const start = parseISO(a.starts_at);
                  const end = parseISO(a.ends_at);
                  const startMin = start.getHours() * 60 + start.getMinutes();
                  const offset = ((startMin - HOUR_START * 60) / 60) * 64; // 64px = h-16
                  const heightMin = (end.getTime() - start.getTime()) / 60000;
                  const height = Math.max((heightMin / 60) * 64 - 4, 30);
                  const patient = patients.find((p) => p.id === a.patient_id);
                  return (
                    <button
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointment(a);
                      }}
                      className="absolute left-1 right-1 rounded-lg bg-[oklch(0.55_0.22_260)]/15 border border-[oklch(0.55_0.22_260)]/40 hover:border-[oklch(0.68_0.20_245)] backdrop-blur-sm px-2 py-1.5 text-left overflow-hidden transition-all hover:scale-[1.01] hover:shadow-[0_8px_24px_-8px_oklch(0.55_0.22_260/0.5)]"
                      style={{ top: offset + 2, height }}
                    >
                      <div className="text-[10px] font-medium text-[oklch(0.78_0.16_250)]">
                        {format(start, "HH:mm")} — {format(end, "HH:mm")}
                      </div>
                      <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                        {patient?.full_name ?? a.title ?? "Consulta"}
                      </div>
                      {a.title && patient && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          {a.title}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <AppointmentFormSheet
        open={open}
        onOpenChange={setOpen}
        appointment={editing}
        initialDate={initialDate}
        ownerId={user?.id}
        patients={patients}
        onSaved={() => {
          setOpen(false);
          load();
        }}
        onDeleted={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}
