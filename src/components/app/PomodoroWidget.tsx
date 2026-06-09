import { useEffect, useRef, useState } from "react";
import { Timer, Play, Pause, RotateCcw, X } from "lucide-react";

type Mode = "focus" | "break";

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  break: 5 * 60,
};

export function PomodoroWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("focus");
  const [seconds, setSeconds] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
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
              { body: mode === "focus" ? "5 minutos de respiro." : "Pomodoro de 25 min." },
            );
          }
          // alterna modo
          const next: Mode = mode === "focus" ? "break" : "focus";
          setMode(next);
          return DURATIONS[next];
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, mode]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const pct = 1 - seconds / DURATIONS[mode];

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
        <div className="fixed bottom-24 md:bottom-6 right-4 z-40 w-64 rounded-2xl border border-border/60 bg-background shadow-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              {mode === "focus" ? "Foco" : "Pausa"}
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

          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={() => {
                setMode("focus");
                setSeconds(DURATIONS.focus);
                setRunning(false);
              }}
              className={`flex-1 h-8 rounded-md text-xs ${mode === "focus" ? "bg-brand/10 text-brand border border-brand/30" : "border border-border/60 text-muted-foreground"}`}
            >
              25 min
            </button>
            <button
              onClick={() => {
                setMode("break");
                setSeconds(DURATIONS.break);
                setRunning(false);
              }}
              className={`flex-1 h-8 rounded-md text-xs ${mode === "break" ? "bg-brand/10 text-brand border border-brand/30" : "border border-border/60 text-muted-foreground"}`}
            >
              5 min
            </button>
          </div>

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
                setSeconds(DURATIONS[mode]);
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
