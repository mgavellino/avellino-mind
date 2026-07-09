import { useEffect, useRef, useState } from "react";
import { Timer, Play, Pause, RotateCcw, X, Pencil, Check } from "lucide-react";

type Mode = "focus" | "break";

const PRESETS: Record<Mode, number[]> = {
  focus: [15, 25, 45, 60],
  break: [5, 10, 15, 20],
};

export function PomodoroWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("focus");
  const [durations, setDurations] = useState<Record<Mode, number>>({
    focus: 25 * 60,
    break: 5 * 60,
  });
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [customValue, setCustomValue] = useState("25");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          setRunning(false);
          try {
            audioRef.current?.play();
          } catch {
            /* ignore */
          }
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(
              mode === "focus" ? "Pausa, Aline!" : "De volta ao foco",
              { body: mode === "focus" ? "Hora de respirar." : "Hora de focar." },
            );
          }
          const next: Mode = mode === "focus" ? "break" : "focus";
          setMode(next);
          return durations[next];
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, mode, durations]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const pct = durations[mode] > 0 ? 1 - seconds / durations[mode] : 0;

  const setMinutes = (mins: number) => {
    const safe = Math.max(1, Math.min(180, Math.round(mins)));
    const secs = safe * 60;
    setDurations((d) => ({ ...d, [mode]: secs }));
    setSeconds(secs);
    setRunning(false);
  };

  const applyCustom = () => {
    const n = parseInt(customValue, 10);
    if (!Number.isNaN(n)) setMinutes(n);
    setEditing(false);
  };

  return (
    <>
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRlIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YS4AAAA=" />

      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            if (typeof Notification !== "undefined" && Notification.permission === "default") {
              Notification.requestPermission();
            }
          }}
          className="fixed bottom-24 md:bottom-6 right-4 z-40 h-10 w-10 grid place-items-center rounded-full bg-surface-elevated border border-border/60 shadow-md hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Abrir Pomodoro"
          title="Pomodoro"
        >
          <Timer className="h-4 w-4" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-24 md:bottom-6 right-4 z-40 w-72 rounded-2xl border border-border/60 bg-background shadow-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center rounded-md border border-border/60 p-0.5 text-xs">
              <button
                onClick={() => {
                  setMode("focus");
                  setSeconds(durations.focus);
                  setRunning(false);
                }}
                className={`px-2 h-6 rounded ${mode === "focus" ? "bg-brand/10 text-brand" : "text-muted-foreground"}`}
              >
                Foco
              </button>
              <button
                onClick={() => {
                  setMode("break");
                  setSeconds(durations.break);
                  setRunning(false);
                }}
                className={`px-2 h-6 rounded ${mode === "break" ? "bg-brand/10 text-brand" : "text-muted-foreground"}`}
              >
                Pausa
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-6 w-6 grid place-items-center rounded-md hover:bg-surface text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-center my-3">
            <div className="text-4xl font-semibold tracking-tight tabular-nums">
              {mm}:{ss}
            </div>
            <div className="mt-2 h-1 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all"
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Duração</span>
            <button
              onClick={() => {
                setCustomValue(String(Math.round(durations[mode] / 60)));
                setEditing((e) => !e);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" /> Personalizar
            </button>
          </div>

          {editing ? (
            <div className="flex items-center gap-1 mb-2">
              <input
                type="number"
                min={1}
                max={180}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyCustom()}
                className="flex-1 h-8 rounded-md border border-border/60 bg-background px-2 text-xs"
                autoFocus
              />
              <span className="text-xs text-muted-foreground">min</span>
              <button
                onClick={applyCustom}
                className="h-8 w-8 grid place-items-center rounded-md bg-foreground text-background"
                aria-label="Aplicar"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1 mb-2">
              {PRESETS[mode].map((m) => {
                const active = durations[mode] === m * 60;
                return (
                  <button
                    key={m}
                    onClick={() => setMinutes(m)}
                    className={`h-8 rounded-md text-xs ${active ? "bg-brand/10 text-brand border border-brand/30" : "border border-border/60 text-muted-foreground hover:text-foreground"}`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex-1 h-9 rounded-md bg-foreground text-background text-xs font-medium inline-flex items-center justify-center gap-1.5"
            >
              {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {running ? "Pausar" : "Iniciar"}
            </button>
            <button
              onClick={() => {
                setSeconds(durations[mode]);
                setRunning(false);
              }}
              className="h-9 w-9 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground"
              aria-label="Reiniciar"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
