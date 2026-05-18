import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import dashboardMockup from "@/assets/dashboard-mockup.jpg";

export function Hero() {
  return (
    <section className="relative pt-40 pb-24 overflow-hidden">
      {/* background */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.55 0.22 260 / 0.18), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-[oklch(0.68_0.20_245)]" />
          <span>Mental Health Platform · LGPD compliant</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] text-gradient-brand"
        >
          A plataforma definitiva
          <br />
          para clínicas modernas.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          AvellPsy é o sistema premium de gestão para psicólogos: agenda, prontuário
          eletrônico com autosave, pagamentos e painel administrativo — tudo em um único
          ambiente seguro.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-9 flex items-center justify-center gap-3"
        >
          <a
            href="#pricing"
            className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Iniciar teste grátis
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-5 py-3 text-sm font-medium text-foreground hover:bg-surface-elevated transition-colors backdrop-blur"
          >
            Ver demonstração
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Criptografia ponta-a-ponta · Servidores no Brasil
        </motion.div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 mx-auto max-w-5xl"
        >
          <div className="relative rounded-2xl border border-border/70 bg-surface/50 p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur">
            <div className="absolute -inset-x-20 -top-20 h-40 bg-[oklch(0.55_0.22_260/0.25)] blur-3xl pointer-events-none" />
            <img
              src={dashboardMockup}
              alt="AvellPsy dashboard"
              className="relative w-full rounded-xl"
              loading="eager"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
