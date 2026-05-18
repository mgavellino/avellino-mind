type LogoProps = { className?: string; showWordmark?: boolean };

export function Logo({ className = "", showWordmark = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AvellPsy logo"
      >
        <defs>
          <linearGradient id="avl-grad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="oklch(0.78 0.16 250)" />
            <stop offset="100%" stopColor="oklch(0.55 0.22 260)" />
          </linearGradient>
        </defs>
        <path
          d="M16 3 L29 28 L23.5 28 L16 13 L8.5 28 L3 28 Z"
          stroke="url(#avl-grad)"
          strokeWidth="2.2"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M11 22 L21 22"
          stroke="url(#avl-grad)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="25" cy="7" r="1.3" fill="oklch(0.78 0.16 250)" />
      </svg>
      {showWordmark && (
        <span className="text-[17px] font-semibold tracking-tight">
          Avell<span className="text-brand" style={{ color: "oklch(0.68 0.20 245)" }}>Psy</span>
        </span>
      )}
    </div>
  );
}
