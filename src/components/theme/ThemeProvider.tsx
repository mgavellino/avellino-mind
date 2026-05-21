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
  // Initialize from localStorage synchronously on the client to avoid flicker.
  const [theme, setThemeState] = useState<Theme>(() => readInitial());

  // Ensure the html class matches on mount (covers SSR hydration mismatch).
  useEffect(() => {
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = (t: Theme) => {
    if (t === theme) return;
    setThemeState(t);
    applyTheme(t);
    // Best-effort: persist to profile if the user is logged in. Does not
    // trigger any re-render or auth-state sync.
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
