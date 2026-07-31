import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Faixa fixa avisando quando o dispositivo está sem internet. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-amber-500/95 px-4 py-2 text-xs font-medium text-amber-950">
      <WifiOff className="h-3.5 w-3.5" />
      Sem internet — você está vendo dados salvos no dispositivo.
    </div>
  );
}
