import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import type { Patient } from "./PatientFormSheet";
import { Trash2 } from "lucide-react";

export type Appointment = {
  id: string;
  owner_id: string;
  patient_id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  initialDate: Date | null;
  ownerId: string | undefined;
  patients: Patient[];
  onSaved: () => void;
  onDeleted: () => void;
};

function toLocalInput(d: Date) {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function AppointmentFormSheet({
  open,
  onOpenChange,
  appointment,
  initialDate,
  ownerId,
  patients,
  onSaved,
  onDeleted,
}: Props) {
  const [patientId, setPatientId] = useState("");
  const [title, setTitle] = useState("Sessão");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [status, setStatus] = useState<Appointment["status"]>("scheduled");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment) {
      setPatientId(appointment.patient_id);
      setTitle(appointment.title ?? "Sessão");
      setStarts(toLocalInput(new Date(appointment.starts_at)));
      setEnds(toLocalInput(new Date(appointment.ends_at)));
      setStatus(appointment.status);
      setNotes(appointment.notes ?? "");
    } else if (initialDate) {
      const end = new Date(initialDate);
      end.setMinutes(end.getMinutes() + 50);
      setPatientId(patients[0]?.id ?? "");
      setTitle("Sessão");
      setStarts(toLocalInput(initialDate));
      setEnds(toLocalInput(end));
      setStatus("scheduled");
      setNotes("");
    }
  }, [appointment, initialDate, open, patients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return toast.error("Selecione um paciente");
    if (!starts || !ends) return toast.error("Defina horário de início e fim");
    if (new Date(ends) <= new Date(starts))
      return toast.error("O término deve ser após o início");
    if (!ownerId) return;

    setSaving(true);
    const payload = {
      patient_id: patientId,
      title: title.trim() || null,
      starts_at: new Date(starts).toISOString(),
      ends_at: new Date(ends).toISOString(),
      status,
      notes: notes.trim() || null,
    };

    if (appointment) {
      const { error } = await supabase
        .from("appointments")
        .update(payload)
        .eq("id", appointment.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Consulta atualizada");
      onSaved();
    } else {
      const { error } = await supabase
        .from("appointments")
        .insert({ ...payload, owner_id: ownerId });
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Consulta agendada");
      onSaved();
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    if (!confirm("Cancelar e remover esta consulta?")) return;
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", appointment.id);
    if (error) return toast.error(error.message);
    toast.success("Consulta removida");
    onDeleted();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-background border-l border-border/60">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {appointment ? "Editar consulta" : "Nova consulta"}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Vincule um paciente, defina o horário e adicione observações.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Paciente *">
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className={inputCls}
            >
              <option value="">Selecione...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Cadastre um paciente antes de agendar.
              </p>
            )}
          </Field>

          <Field label="Título">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Início *">
              <input
                type="datetime-local"
                value={starts}
                onChange={(e) => setStarts(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Término *">
              <input
                type="datetime-local"
                value={ends}
                onChange={(e) => setEnds(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Appointment["status"])}
              className={inputCls}
            >
              <option value="scheduled">Agendada</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Realizada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">Não compareceu</option>
            </select>
          </Field>

          <Field label="Observações">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputCls} resize-none py-2`}
            />
          </Field>

          <div className="flex items-center justify-between gap-2 pt-2">
            {appointment ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {saving ? "Salvando..." : appointment ? "Salvar" : "Agendar"}
              </button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
