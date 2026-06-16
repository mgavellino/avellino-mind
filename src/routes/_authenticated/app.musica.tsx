import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  LogOut,
  Settings,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  beginLogin,
  exchangeCode,
  getAccessToken,
  getClientId,
  getRedirectUri,
  isLoggedIn,
  logout,
  setClientId,
  spotifyFetch,
} from "@/lib/spotify-auth";

export const Route = createFileRoute("/_authenticated/app/musica")({
  component: MusicPage,
});

type Track = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
};

type Playlist = {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
  uri: string;
};

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

function MusicPage() {
  const [authed, setAuthed] = useState(isLoggedIn());
  const [clientIdInput, setClientIdInput] = useState(getClientId());
  const [showSettings, setShowSettings] = useState(!getClientId());
  const [profile, setProfile] = useState<{ display_name: string; product: string } | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);
  const [paused, setPaused] = useState(true);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const playerRef = useRef<any>(null);

  // Handle OAuth callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (code) {
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      window.history.replaceState({}, "", url.toString());
      exchangeCode(code)
        .then(() => {
          setAuthed(true);
          toast.success("Conectado ao Spotify");
        })
        .catch(() => toast.error("Falha no login Spotify"));
    }
  }, []);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (!authed) return;
    if (document.getElementById("spotify-sdk")) {
      initPlayer();
      return;
    }
    const script = document.createElement("script");
    script.id = "spotify-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = initPlayer;
    return () => {
      playerRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const initPlayer = async () => {
    if (playerRef.current) return;
    const token = await getAccessToken();
    if (!token || !window.Spotify) return;
    const player = new window.Spotify.Player({
      name: "Aline · Web Player",
      getOAuthToken: (cb: (t: string) => void) => getAccessToken().then((t) => t && cb(t)),
      volume: 0.6,
    });
    playerRef.current = player;
    player.addListener("ready", ({ device_id }: any) => setDeviceId(device_id));
    player.addListener("player_state_changed", (state: any) => {
      if (!state) return;
      setPaused(state.paused);
      const t = state.track_window.current_track;
      if (t) setCurrent({ id: t.id, name: t.name, artists: t.artists, album: t.album });
    });
    player.addListener("initialization_error", ({ message }: any) => toast.error(message));
    player.addListener("authentication_error", () => {
      logout();
      setAuthed(false);
    });
    player.addListener("account_error", () =>
      toast.error("Spotify Web Playback requer conta Premium"),
    );
    player.connect();
  };

  // Load profile + playlists
  useEffect(() => {
    if (!authed) return;
    spotifyFetch("/me").then(setProfile).catch(() => {});
    spotifyFetch("/me/playlists?limit=50")
      .then((d) => setPlaylists(d?.items ?? []))
      .catch(() => {});
  }, [authed]);

  const playContext = async (uri: string) => {
    if (!deviceId) return toast.error("Player ainda iniciando...");
    try {
      await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({ context_uri: uri }),
      });
    } catch {
      toast.error("Falha ao tocar (Premium é obrigatório)");
    }
  };

  const togglePlay = () => playerRef.current?.togglePlay();
  const next = () => playerRef.current?.nextTrack();
  const prev = () => playerRef.current?.previousTrack();

  const saveClientId = () => {
    if (!clientIdInput.trim()) return toast.error("Cole o Client ID");
    setClientId(clientIdInput);
    setShowSettings(false);
    toast.success("Client ID salvo");
  };

  if (showSettings || !getClientId()) {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">Configurar Spotify</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Pra tocar música aqui dentro você precisa de um Client ID gratuito do Spotify.
        </p>
        <ol className="space-y-3 text-sm mb-6 list-decimal list-inside text-muted-foreground">
          <li>
            Acesse{" "}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-brand inline-flex items-center gap-1"
            >
              developer.spotify.com/dashboard <ExternalLink className="h-3 w-3" />
            </a>{" "}
            e faça login.
          </li>
          <li>Clique em <b>Create app</b>. Nome: "Aline App", descrição qualquer.</li>
          <li>
            Em <b>Redirect URIs</b> cole exatamente:
            <code className="block mt-1 px-2 py-1.5 rounded bg-surface text-foreground text-xs break-all">
              {getRedirectUri()}
            </code>
          </li>
          <li>Marque <b>Web API</b> e <b>Web Playback SDK</b>, salve.</li>
          <li>Copie o <b>Client ID</b> e cole abaixo.</li>
        </ol>
        <div className="rounded-2xl border border-border/60 bg-surface/40 p-4">
          <label className="text-xs text-muted-foreground">Spotify Client ID</label>
          <input
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
            placeholder="ex: 8a1d...3f4"
            className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm font-mono"
          />
          <button
            onClick={saveClientId}
            className="mt-3 w-full h-10 rounded-lg bg-foreground text-background text-sm font-medium"
          >
            Salvar e conectar
          </button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          ⚠️ O player completo (tocar dentro do site) só funciona com conta Spotify Premium. Sem Premium, dá pra ver
          playlists e abrir no app oficial.
        </p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 grid place-items-center mb-4">
          <Music className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Conectar Spotify</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Faça login pra ver suas playlists e tocar música dentro do app.
        </p>
        <button
          onClick={() => beginLogin().catch((e) => toast.error(e.message))}
          className="mt-6 h-11 px-6 rounded-full bg-[#1DB954] text-white text-sm font-medium"
        >
          Entrar com Spotify
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <Settings className="h-3 w-3" /> Trocar Client ID
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-32">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Música</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile ? `Logada como ${profile.display_name}` : "Carregando..."}
            {profile?.product && profile.product !== "premium" && (
              <span className="ml-2 text-amber-500">· Premium necessário pra tocar</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="h-9 px-3 rounded-lg text-xs border border-border/60 inline-flex items-center gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" /> Config
          </button>
          <button
            onClick={() => {
              logout();
              setAuthed(false);
            }}
            className="h-9 px-3 rounded-lg text-xs border border-border/60 inline-flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </div>

      {playlists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => playContext(p.uri)}
              className="text-left rounded-xl border border-border/60 bg-surface/40 p-3 hover:bg-surface transition-colors group"
            >
              <div className="aspect-square rounded-lg bg-surface overflow-hidden mb-2 relative">
                {p.images?.[0] ? (
                  <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Music className="h-8 w-8 text-muted-foreground/40 absolute inset-0 m-auto" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 grid place-items-center transition-opacity">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
              </div>
              <div className="text-xs font-medium line-clamp-1">{p.name}</div>
              <div className="text-[10px] text-muted-foreground">{p.tracks.total} músicas</div>
            </button>
          ))}
        </div>
      )}

      {/* Player bar */}
      {current && (
        <div className="fixed bottom-0 md:bottom-0 inset-x-0 md:left-60 z-40 border-t border-border/60 bg-background/95 backdrop-blur px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            {current.album.images?.[0] && (
              <img src={current.album.images[0].url} alt="" className="h-12 w-12 rounded" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{current.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {current.artists.map((a) => a.name).join(", ")}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={prev} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface">
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={togglePlay}
                className="h-10 w-10 grid place-items-center rounded-full bg-foreground text-background"
              >
                {paused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4 fill-current" />}
              </button>
              <button onClick={next} className="h-9 w-9 grid place-items-center rounded-full hover:bg-surface">
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
