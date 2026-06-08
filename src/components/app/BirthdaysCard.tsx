import { useEffect, useState } from "react";
import { Cake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Birthday = { id: string; full_name: string; birth_date: string; day: number };

const MONTH_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function BirthdaysCard() {
  const { user } = useAuth();
  const [list, setList] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patients")
      .select("id, full_name, birth_date")
      .eq("is_active", true)
      .not("birth_date", "is", null)
      .then(({ data }) => {
        const now = new Date();
        const month = now.getMonth();
        const items = ((data ?? []) as { id: string; full_name: string; birth_date: string }[])
          .map((p) => {
            const d = new Date(p.birth_date + "T12:00:00");
            return { id: p.id, full_name: p.full_name, birth_date: p.birth_date, day: d.getDate(), m: d.getMonth() };
          })
          .filter((p) => p.m === month)
          .sort((a, b) => a.day - b.day);
        setList(items);
        setLoading(false);
      });
  }, [user]);

  const now = new Date();

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Cake className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-medium">Aniversariantes de {MONTH_PT[now.getMonth()]}</h2>
      </div>
      <div className="mt-4 space-y-1.5">
        {loading ? (
          <div className="text-center text-xs text-muted-foreground py-4">...</div>
        ) : list.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-4">Ninguém faz aniversário esse mês.</div>
        ) : (
          list.map((p) => {
            const isToday = p.day === now.getDate();
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  isToday ? "bg-brand/10 border border-brand/30" : ""
                }`}
              >
                <div className="text-center w-10 shrink-0">
                  <div className="text-lg font-semibold leading-none">{p.day}</div>
                </div>
                <div className="flex-1 text-sm truncate">{p.full_name}</div>
                {isToday && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand text-primary-foreground">
                    Hoje 🎂
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
