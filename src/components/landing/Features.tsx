import { motion } from "motion/react";
import {
  Calendar,
  FileText,
  Users,
  Image as ImageIcon,
  Shield,
  Download,
  Upload,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agenda inteligente",
    description:
      "Visualização semanal de 7h às 21h com criação por clique no slot. Cores por status: agendada, realizada, faltou, cancelada.",
  },
  {
    icon: FileText,
    title: "Prontuário com autosave",
    description:
      "Editor estilo Word com salvamento em tempo real, histórico de versões e restauração de qualquer ponto.",
  },
  {
    icon: Users,
    title: "Gestão de pacientes",
    description:
      "Ficha completa, foto, contato, histórico clínico e busca instantânea em interface limpa.",
  },
  {
    icon: Download,
    title: "Exportação PDF e DOCX",
    description:
      "Gere prontuários profissionais em PDF ou DOCX com um clique para entregar ao paciente ou ao judiciário.",
  },
  {
    icon: Upload,
    title: "Importação CSV",
    description:
      "Migrou de outra plataforma? Importe sua lista de pacientes por CSV e exporte de volta sempre que quiser.",
  },
  {
    icon: ImageIcon,
    title: "Foto de pacientes",
    description:
      "Upload de avatar para profissional e cada paciente. Identificação visual rápida na agenda e na ficha.",
  },
  {
    icon: Shield,
    title: "Segurança LGPD",
    description:
      "Criptografia, RLS por usuário, logs de auditoria e permissões granulares por papel e por plano.",
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
            Construído com a precisão de softwares clínicos internacionais — sem o peso
            deles.
          </p>
        </div>

        <div className="mt-14 grid gap-px rounded-2xl border border-border/60 bg-border/60 overflow-hidden md:grid-cols-3 lg:grid-cols-3">
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
