import { Logo } from "@/components/brand/Logo";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Soft decorative gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent-warm) 0%, transparent 70%)" }}
      />

      <header className="relative p-6">
        <Logo size={42} />
      </header>

      <main className="relative flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-gradient-brand">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-elevated backdrop-blur">
            {children}
          </div>
        </div>
      </main>

      <footer className="relative text-center pb-6 text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} Aline Dias · Psicóloga
      </footer>
    </div>
  );
}
