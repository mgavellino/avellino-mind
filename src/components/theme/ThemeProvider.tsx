import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Theme = "dark" | "light";

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") root.classList.add("light");
  else root.classList.remove("light");
  try {
    localStorage.setItem("avellpsy-theme", theme);
  } catch {}
}

export function useTheme() {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    let initial: Theme = "dark";
    try {
      const stored = localStorage.getItem("avellpsy-theme");
      if (stored === "light" || stored === "dark") initial = stored;
    } catch {}
    setThemeState(initial);
    apply(initial);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("theme")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const t = (data as { theme?: string } | null)?.theme;
        if (t === "light" || t === "dark") {
          setThemeState(t);
          apply(t);
        }
      });
  }, [user]);

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    apply(t);
    if (user) {
      await supabase.from("profiles").update({ theme: t }).eq("id", user.id);
    }
  };

  return { theme, setTheme };
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex rounded-lg border border-border/60 bg-surface p-1">
      <button
        onClick={() => setTheme("light")}
        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
          theme === "light" ? "bg-foreground text-background" : "text-muted-foreground"
        }`}
      >
        Claro
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
          theme === "dark" ? "bg-foreground text-background" : "text-muted-foreground"
        }`}
      >
        Escuro
      </button>
    </div>
  );
}
