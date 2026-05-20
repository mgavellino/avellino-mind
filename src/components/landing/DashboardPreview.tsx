import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  CreditCard,
  Settings,
  Search,
  Bell,
  TrendingUp,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const nav = [
  { icon: LayoutDashboard, label: "Dashboard", active: false },
  { icon: Calendar, label: "Agenda", active: true },
  { icon: Users, label: "Pacientes" },
  { icon: FileText, label: "Prontuários" },
  { icon: CreditCard, label: "Financeiro" },
  { icon: Settings, label: "Configurações" },
];

const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const days = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

type Evt = {
  day: number;
  hour: number;
  durH: number;
  label: string;
  sub: string;
  status: "scheduled" | "completed" | "no_show" | "cancelled";
};

const events: Evt[] = [
  { day: 0, hour: 9, durH: 1, label: "Ana Souza", sub: "Sessão", status: "completed" },
  { day: 0, hour: 14, durH: 1, label: "Lucas Martins", sub: "Sessão", status: "scheduled" },
  { day: 1, hour: 10, durH: 1, label: "Reunião supervisão", sub: "Equipe", status: "scheduled" },
  { day: 2, hour: 11, durH: 1, label: "Carla Lima", sub: "Sessão", status: "completed" },
  { day: 2, hour: 16, durH: 1, label: "Pedro Reis", sub: "Sessão", status: "no_show" },
  { day: 3, hour: 9, durH: 1, label: "João Pires", sub: "Sessão", status: "completed" },
  { day: 3, hour: 15, durH: 1, label: "Marina Dias", sub: "Sessão", status: "scheduled" },
  { day: 4, hour: 10, durH: 1, label: "Beatriz Sá", sub: "Sessão", status: "cancelled" },
  { day: 4, hour: 14, durH: 1, label: "Renato Aoki", sub: "Sessão", status: "scheduled" },
];

const statusStyle: Record<Evt["status"], string> = {
  scheduled:
    "bg-[oklch(0.55_0.22_260)]/15 border-[oklch(0.55_0.22_260)]/45 text-[oklch(0.82_0.16_250)]",
  completed:
    "bg-[oklch(0.55_0.18_155)]/15 border-[oklch(0.55_0.18_155)]/45 text-[oklch(0.82_0.18_155)]",
  no_show:
    "bg-[oklch(0.65_0.18_70)]/15 border-[oklch(0.65_0.18_70)]/45 text-[oklch(0.82_0.16_75)]",
  cancelled:
    "bg-[oklch(0.55_0.20_25)]/12 border-[oklch(0.55_0.20_25)]/40 text-[oklch(0.78_0.16_25)] line-through",
};

export function DashboardPreview() {
  return (
    <div className="rounded-2xl border border-border/70 bg-surface/60 overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-border/50 bg-surface/80">
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.22_25)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.78_0.18_85)]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.18_150)]" />
        <span className="ml-3 text-[10px] text-muted-foreground/70">avellpsy.com.br/app/agenda</span>
      </div>

      <div className="grid grid-cols-[170px_1fr] min-h-[440px]">
        {/* Sidebar */}
        <aside className="border-r border-border/50 bg-surface/40 py-4 px-2.5">
          <div className="px-2 pb-3">
            <Logo />
          </div>
          <nav className="space-y-0.5">
            {nav.map((n) => (
              <div
                key={n.label}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${
                  n.active
                    ? "bg-surface-elevated text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <n.icon className="h-3 w-3" />
                {n.label}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="min-w-0">
          {/* Topbar */}
          <div className="h-9 border-b border-border/50 flex items-center px-3 gap-2 bg-background/40">
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <div className="h-6 pl-6 pr-2 rounded-md bg-surface border border-border/60 text-[10px] text-muted-foreground/70 flex items-center">
                Buscar pacientes, consultas...
              </div>
            </div>
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="h-6 w-6 rounded-full bg-gradient-brand grid place-items-center text-[10px] text-white">
              M
            </span>
          </div>

          {/* Page content */}
          <div className="p-4">
            <div className="flex items-end justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold tracking-tight">Agenda</h3>
                <p className="text-[10px] text-muted-foreground capitalize">12 mai – 18 mai 2026</p>
              </div>
              <div className="flex items-center gap-2 text-[9px]">
                <Legend color="oklch(0.55_0.22_260)" label="Agendada" />
                <Legend color="oklch(0.55_0.18_155)" label="Realizada" />
                <Legend color="oklch(0.65_0.18_70)" label="Faltou" />
                <Legend color="oklch(0.55_0.20_25)" label="Cancelada" />
              </div>
            </div>

            {/* Calendar grid */}
            <div className="rounded-lg border border-border/50 bg-surface/30 overflow-hidden">
              <div className="grid grid-cols-[36px_repeat(7,1fr)] border-b border-border/40 bg-surface/40">
                <div />
                {days.map((d) => (
                  <div
                    key={d}
                    className="px-1.5 py-1.5 border-l border-border/40 text-center text-[9px] uppercase tracking-wider text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[36px_repeat(7,1fr)] relative">
                <div>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="h-7 border-b border-border/30 text-[8px] text-muted-foreground pr-1 text-right pt-0.5"
                    >
                      {h}h
                    </div>
                  ))}
                </div>
                {days.map((_, dayIdx) => (
                  <div key={dayIdx} className="relative border-l border-border/40">
                    {hours.map((h) => (
                      <div key={h} className="h-7 border-b border-border/30" />
                    ))}
                    {events
                      .filter((e) => e.day === dayIdx)
                      .map((e, i) => {
                        const top = (e.hour - hours[0]) * 28 + 1;
                        const height = e.durH * 28 - 2;
                        return (
                          <div
                            key={i}
                            className={`absolute left-0.5 right-0.5 rounded border px-1 py-0.5 overflow-hidden ${statusStyle[e.status]}`}
                            style={{ top, height }}
                          >
                            <div className="text-[8px] font-semibold truncate">{e.label}</div>
                            <div className="text-[7px] opacity-70 truncate">{e.sub}</div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom stat cards */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Stat label="Pacientes ativos" value="48" trend="+6" />
              <Stat label="Consultas hoje" value="7" trend="+2" />
              <Stat label="Receita do mês" value="R$ 6.420" trend="+12%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span
        className="h-2 w-2 rounded-sm border"
        style={{ background: `oklch(${color} / 0.25)`, borderColor: `oklch(${color} / 0.6)` }}
      />
      {label}
    </span>
  );
}

function Stat({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-surface/40 p-2.5">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-sm font-semibold">{value}</span>
        <span className="inline-flex items-center text-[9px] text-[oklch(0.78_0.18_155)]">
          <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
          {trend}
        </span>
      </div>
    </div>
  );
}
