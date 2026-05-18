import { motion } from "motion/react";
import {
  Calendar,
  FileText,
  Users,
  CreditCard,
  Shield,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agenda inteligente",
    description:
      "Visualização mensal, semanal e diária com drag-and-drop e lembretes automáticos.",
  },
  {
    icon: FileText,
    title: "Prontuário com autosave",
    description:
      "Editor estilo Word com salvamento em tempo real. Cada palavra é preservada instantaneamente.",
  },
  {
    icon: Users,
    title: "Gestão de pacientes",
    description:
      "Ficha completa, histórico, anexos e busca rápida em uma interface limpa.",
  },
  {
    icon: CreditCard,
    title: "Pagamentos integrados",
    description:
      "Mercado Pago nativo, assinaturas, renovações e bloqueio automático por vencimento.",
  },
  {
    icon: Shield,
    title: "Segurança LGPD",
    description:
      "Criptografia, RLS, logs de auditoria e permissões granulares por papel.",
  },
  {
    icon: BarChart3,
    title: "Analytics em tempo real",
    description:
      "Faturamento, consultas concluídas e métricas de crescimento ao seu alcance.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.2em] text-[oklch(0.68_0.20_245)]">
            Recursos
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-gradient-brand">
            Tudo o que sua clínica precisa.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Construído com a precisão de softwares médicos internacionais — sem o peso
            deles.
          </p>
        </div>

        <div className="mt-14 grid gap-px rounded-2xl border border-border/60 bg-border/60 overflow-hidden md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative bg-background p-7 transition-colors hover:bg-surface"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-elevated border border-border/80">
                <f.icon className="h-5 w-5 text-[oklch(0.68_0.20_245)]" />
              </div>
              <h3 className="mt-5 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
