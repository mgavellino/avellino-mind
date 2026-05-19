import { useEffect, useState } from "react";
import { Music, X, ChevronDown, ChevronUp } from "lucide-react";

const STORAGE_KEY = "avellpsy:spotify_uri";

/**
 * Extracts a Spotify embed URL from any spotify link/URI.
 * Supports: open.spotify.com/{type}/{id}, spotify:{type}:{id}
 */
function toEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(
    /open\.spotify\.com\/(?:intl-[a-z]+\/)?(playlist|track|album|artist|episode|show)\/([a-zA-Z0-9]+)/,
  );
  if (urlMatch) return `https://open.spotify.com/embed/${urlMatch[1]}/${urlMatch[2]}?utm_source=avellpsy`;
  const uriMatch = trimmed.match(/spotify:(playlist|track|album|artist|episode|show):([a-zA-Z0-9]+)/);
  if (uriMatch) return `https://open.spotify.com/embed/${uriMatch[1]}/${uriMatch[2]}?utm_source=avellpsy`;
  return null;
}

export function SpotifyPlayer() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setUri(saved);
  }, []);

  const save = () => {
    const embed = toEmbedUrl(input);
    if (!embed) return;
    localStorage.setItem(STORAGE_KEY, embed);
    setUri(embed);
    setInput("");
  };

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUri(null);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Spotify"
        className="fixed bottom-5 right-5 z-40 h-11 w-11 grid place-items-center rounded-full bg-[#1DB954] text-black shadow-[0_10px_30px_-10px_rgba(29,185,84,0.6)] hover:scale-105 transition-transform"
      >
        <Music className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[360px] rounded-2xl border border-border/60 bg-background/95 backdrop-blur shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="flex items-center justify-between px-3 h-10 border-b border-border/60 bg-surface/40">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Music className="h-3.5 w-3.5 text-[#1DB954]" />
          Spotify
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="p-3 space-y-2">
          {uri ? (
            <>
              <iframe
                src={uri}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-lg"
              />
              <button
                onClick={clear}
                className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Trocar playlist
              </button>
            </>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Cole o link de uma playlist, álbum ou faixa do Spotify.
              </p>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="https://open.spotify.com/playlist/..."
                className="w-full h-9 px-3 rounded-lg bg-surface border border-border/60 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                onClick={save}
                disabled={!toEmbedUrl(input)}
                className="w-full h-9 rounded-lg bg-[#1DB954] text-black text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Tocar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
