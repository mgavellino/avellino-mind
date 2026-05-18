import { Link } from "@tanstack/react-router";
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-60" />
      <header className="relative p-6">
        <Link to="/" className="inline-flex">
          <Logo />
        </Link>
      </header>
      <main className="relative flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-gradient-brand">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
