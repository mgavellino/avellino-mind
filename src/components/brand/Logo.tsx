const LOGO_URL = "/aline-logo.jpg";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  /** size of the mark in px */
  size?: number;
};

export function Logo({ className = "", showWordmark = true, size = 36 }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoAsset.url}
        alt="Aline Dias — Psicóloga"
        width={size}
        height={size}
        className="rounded-full object-cover ring-1 ring-border/60"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <div className="leading-tight">
          <div
            className="text-[15px] tracking-tight"
            style={{ fontFamily: '"Dancing Script", "Great Vibes", cursive', color: "var(--brand)" }}
          >
            Aline Dias
          </div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            Psicóloga
          </div>
        </div>
      )}
    </div>
  );
}
