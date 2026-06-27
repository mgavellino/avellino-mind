import { motion } from "framer-motion";
import { Brain, Heart, Users, Activity, Sparkles, Moon } from "lucide-react";

const groups = [
  {
    icon: Activity,
    title: "Ansiedade e regulação emocional",
    items: [
      "Ansiedade excessiva",
      "Crises de ansiedade ou pânico",
      "Dificuldade em lidar com emoções intensas",
      "Estresse e sobrecarga",
    ],
  },
  {
    icon: Sparkles,
    title: "Autoestima e padrões de pensamento",
    items: [
      "Baixa autoestima",
      "Autocrítica elevada",
      "Pensamentos negativos recorrentes",
      "Medo de rejeição ou abandono",
    ],
  },
  {
    icon: Heart,
    title: "Relacionamentos e vida familiar",
    items: [
      "Dificuldade em estabelecer limites",
      "Dependência emocional",
      "Conflitos familiares",
      "Comunicação difícil ou desgastante",
    ],
  },
  {
    icon: Brain,
    title: "Comportamentos e rotina",
    items: [
      "Procrastinação",
      "Dificuldade de organização",
      "Evitação de situações importantes",
      "Dificuldade em tomar decisões",
    ],
  },
  {
    icon: Users,
    title: "Adolescentes",
    items: [
      "Ansiedade e insegurança",
      "Conflitos com pais",
      "Dificuldades sociais",
      "Desenvolvimento de autonomia",
    ],
  },
  {
    icon: Moon,
    title: "Saúde emocional e qualidade de vida",
    items: [
      "Insônia",
      "Estresse",
      "Sobrecarga emocional",
      "Equilíbrio entre rotina e autocuidado",
    ],
  },
];

const TCC = () => {
  return (
    <section id="tcc" className="py-28 bg-background">
      <div className="container mx-auto px-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <p className="text-xs tracking-[0.35em] uppercase text-primary font-body font-medium mb-4">
            Abordagem
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-medium text-foreground mb-4 leading-snug">
            O que é a Terapia Cognitivo-Comportamental?
          </h2>
          <div className="w-12 h-px bg-accent mx-auto mb-8" />

          <div className="space-y-5 text-muted-foreground font-body text-base md:text-[17px] leading-[1.8] text-center">
            <p>
              A <span className="text-foreground font-medium">Terapia Cognitivo-Comportamental (TCC)</span> é uma abordagem psicológica
              baseada em evidências científicas, que busca compreender como nossos pensamentos, emoções e comportamentos estão interligados.
            </p>
            <p>
              A TCC parte do princípio de que a forma como interpretamos as situações influencia diretamente como nos sentimos e como agimos.
              Muitas vezes, desenvolvemos padrões de pensamento automáticos e crenças que podem gerar sofrimento, ansiedade ou dificuldades nos relacionamentos.
            </p>
            <p>
              Durante o processo terapêutico, trabalhamos juntos para identificar esses padrões, desenvolver formas mais saudáveis de pensar
              e construir estratégias práticas para lidar com os desafios do dia a dia.
            </p>
            <p>
              É uma abordagem <span className="text-foreground font-medium">estruturada, colaborativa e focada no presente</span>,
              com resultados consistentes no tratamento de diversas demandas emocionais.
            </p>
          </div>
        </motion.div>

        {/* Demands */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-5xl mx-auto mb-12"
        >
          <h3 className="text-2xl md:text-3xl font-heading font-medium text-foreground text-center mb-3">
            Quais demandas a TCC pode ajudar?
          </h3>
          <p className="text-muted-foreground font-body text-sm md:text-base text-center max-w-2xl mx-auto mb-12">
            Atendimento para adolescentes e adultos em diferentes momentos da vida, auxiliando em questões como:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {groups.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="bg-secondary rounded-2xl p-7 border border-border hover:border-primary/30 transition-colors flex flex-col h-full"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-5 flex-shrink-0">
                  <g.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-heading text-lg font-medium text-foreground mb-4 leading-snug min-h-[3.5rem]">{g.title}</h4>
                <ul className="space-y-2.5">
                  {g.items.map((item) => (
                    <li key={item} className="text-muted-foreground font-body text-sm leading-relaxed flex items-start gap-2.5">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mt-20"
        >
          <h3 className="text-2xl md:text-3xl font-heading font-medium text-foreground mb-4">
            Como funciona o atendimento?
          </h3>
          <div className="w-12 h-px bg-accent mx-auto mb-8" />
          <div className="space-y-5 text-muted-foreground font-body text-base leading-relaxed">
            <p>
              O atendimento é individual, realizado de forma <span className="text-foreground font-medium">presencial ou online</span>,
              em um espaço acolhedor, ético e sigiloso.
            </p>
            <p>
              Cada processo é único e respeita o ritmo e as necessidades de cada pessoa.
              O objetivo é promover mais autonomia, bem-estar emocional e qualidade de vida.
            </p>
            <p className="text-foreground italic">
              Se você sente que precisa de ajuda para lidar com suas emoções, pensamentos ou relações, a terapia pode ser um caminho importante.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TCC;
