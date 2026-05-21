import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "dark" | "light";
const STORAGE_KEY = "avellpsy-theme";

type Ctx = { theme: Theme; setTheme: (t: Theme) => void };
const ThemeContext = createContext<Ctx>({ theme: "dark", setTheme: () => {} });

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") root.classList.add("light");
  else root.classList.remove("light");
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Apply stored theme as soon as we hit the client
  useEffect(() => {
    const initial = readInitial();
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  // Sync with profile when user logs in
  useEffect(() => {
    const sync = async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("profiles")
        .select("theme")
        .eq("id", uid)
        .maybeSingle();
      const t = (data as { theme?: string } | null)?.theme;
      if (t === "light" || t === "dark") {
        setThemeState(t);
        applyTheme(t);
      }
    };
    sync();
    const { data: sub } = supabase.auth.onAuthStateChange(() => sync());
    return () => sub.subscription.unsubscribe();
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) supabase.from("profiles").update({ theme: t }).eq("id", uid).then(() => {});
    });
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
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
