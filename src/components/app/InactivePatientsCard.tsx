import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { UserX, ArrowRight } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Inactive = { id: string; full_name: string; last_seen: string | null };

export function InactivePatientsCard() {
  const { user } = useAuth();
  const [list, setList] = useState<Inactive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const { data: patients } = await supabase
        .from("patients")
        .select("id, full_name")
        .eq("is_active", true);
      const ids = (patients ?? []).map((p) => p.id);
      if (!ids.length) {
        setLoading(false);
        return;
      }
      const { data: lastAppts } = await supabase
        .from("appointments")
        .select("patient_id, starts_at")
        .in("patient_id", ids)
        .lte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: false });
      const lastByPatient: Record<string, string> = {};
      for (const a of (lastAppts ?? []) as { patient_id: string; starts_at: string }[]) {
        if (!lastByPatient[a.patient_id]) lastByPatient[a.patient_id] = a.starts_at;
      }
      const inactives = (patients ?? [])
        .map((p) => ({ id: p.id, full_name: p.full_name, last_seen: lastByPatient[p.id] ?? null }))
        .filter((p) => !p.last_seen || parseISO(p.last_seen) < cutoff)
        .sort((a, b) => {
          if (!a.last_seen) return -1;
          if (!b.last_seen) return 1;
          return a.last_seen.localeCompare(b.last_seen);
        })
        .slice(0, 8);
      setList(inactives);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 md:p-6">
      <div className="flex items-center gap-2">
        <UserX className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-medium">Inativos há +30 dias</h2>
      </div>
      <div className="mt-4 space-y-1.5">
        {loading ? (
          <div className="text-center text-xs text-muted-foreground py-4">...</div>
        ) : list.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-4">Ninguém inativo. 👏</div>
        ) : (
          list.map((p) => (
            <Link
              key={p.id}
              to="/app/pacientes"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{p.full_name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {p.last_seen
                    ? `há ${formatDistanceToNow(parseISO(p.last_seen), { locale: ptBR })}`
                    : "sem consultas registradas"}
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
