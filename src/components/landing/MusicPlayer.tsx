import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
const ambient = "/landing-audio/ambient.mp3";

const MusicPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(ambient);
    audio.loop = true;
    audio.volume = 0.25;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        /* autoplay blocked or other */
      }
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={playing ? "Pausar música ambiente" : "Tocar música ambiente"}
      className="fixed bottom-6 left-6 z-40 h-11 pl-3 pr-4 rounded-full bg-background/90 backdrop-blur border border-border shadow-md flex items-center gap-2 text-foreground/85 hover:text-foreground hover:border-primary/50 hover:bg-background transition-all group"
    >
      <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
        {playing ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5" />
        )}
        {playing && (
          <span className="absolute inset-0 rounded-full ring-2 ring-primary/40 animate-pulse" />
        )}
      </span>
      <span className="font-body text-xs font-medium tracking-wide">
        {playing ? "Pausar música" : "Tocar música"}
      </span>
    </button>
  );
};

export default MusicPlayer;
