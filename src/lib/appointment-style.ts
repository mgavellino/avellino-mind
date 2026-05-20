import type { AppointmentStatus } from "@/components/app/AppointmentFormSheet";

export const STATUS_STYLE: Record<
  AppointmentStatus,
  { bg: string; border: string; text: string; label: string; extra?: string }
> = {
  scheduled: {
    bg: "bg-[oklch(0.55_0.22_260)]/15",
    border: "border-[oklch(0.55_0.22_260)]/45",
    text: "text-[oklch(0.82_0.16_250)]",
    label: "Agendada",
  },
  completed: {
    bg: "bg-[oklch(0.55_0.18_155)]/15",
    border: "border-[oklch(0.55_0.18_155)]/45",
    text: "text-[oklch(0.82_0.18_155)]",
    label: "Realizada",
  },
  no_show: {
    bg: "bg-[oklch(0.65_0.18_70)]/15",
    border: "border-[oklch(0.65_0.18_70)]/45",
    text: "text-[oklch(0.85_0.16_75)]",
    label: "Faltou",
  },
  cancelled: {
    bg: "bg-[oklch(0.55_0.20_25)]/12",
    border: "border-[oklch(0.55_0.20_25)]/40",
    text: "text-[oklch(0.78_0.16_25)]",
    label: "Cancelada",
    extra: "line-through opacity-70",
  },
};

export const KIND_LABELS = {
  consulta: "Consulta",
  reuniao: "Reunião",
  supervisao: "Supervisão",
  pessoal: "Pessoal",
  outro: "Outro",
} as const;
