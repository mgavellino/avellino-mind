import { useEffect, useState } from "react";
import { Cake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type B = { id: string; full_name: string; day: number; isToday: boolean };

export function BirthdayReminderBanner() {
  const { user } = useAuth();
  const [list, setList] = useState<B[]>([]);

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
        const today = now.getDate();
        const items = ((data ?? []) as { id: string; full_name: string; birth_date: string }[])
          .map((p) => {
            const d = new Date(p.birth_date + "T12:00:00");
            return { id: p.id, full_name: p.full_name, day: d.getDate(), m: d.getMonth() };
          })
          .filter((p) => p.m === month && p.day >= today && p.day <= today + 7)
          .sort((a, b) => a.day - b.day)
          .map((p) => ({ id: p.id, full_name: p.full_name, day: p.day, isToday: p.day === today }));
        setList(items);
      });
  }, [user]);

  if (list.length === 0) return null;

  const todayList = list.filter((p) => p.isToday);
  const upcoming = list.filter((p) => !p.isToday);

  return (
    <div className="md:hidden rounded-2xl border border-brand/30 bg-brand/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Cake className="h-4 w-4 text-brand" />
        <h3 className="text-sm font-semibold">
          {todayList.length > 0 ? "Aniversário hoje! 🎂" : "Aniversários dessa semana"}
        </h3>
      </div>
      <div className="space-y-1.5">
        {todayList.map((p) => (
          <div key={p.id} className="text-sm font-medium">
            {p.full_name} — hoje
          </div>
        ))}
        {upcoming.map((p) => (
          <div key={p.id} className="text-xs text-muted-foreground">
            {p.full_name} — dia {p.day}
          </div>
        ))}
      </div>
    </div>
  );
}
