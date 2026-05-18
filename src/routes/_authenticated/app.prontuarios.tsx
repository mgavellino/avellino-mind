import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/prontuarios")({
  component: () => (
    <ComingSoon
      icon={<FileText className="h-6 w-6" />}
      title="Prontuários"
      description="Editor estilo Word com autosave em tempo real. Em desenvolvimento — entra na próxima fase."
    />
  ),
});

function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl mx-auto pt-20 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand text-white mb-5">
        {icon}
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/40 px-3 py-1 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.68_0.20_245)]" />
        Próxima fase
      </span>
    </div>
  );
}
