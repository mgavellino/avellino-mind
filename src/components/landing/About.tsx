import { motion } from "framer-motion";

const About = () => {
  return (
    <section id="sobre" className="py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <p className="text-xs tracking-[0.35em] uppercase text-primary font-body font-medium mb-4 text-center">
            Sobre mim
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-medium text-foreground mb-8 text-center leading-snug">
            Acredito que toda pessoa merece ser ouvida
          </h2>
          <div className="w-12 h-px bg-accent mx-auto mb-8" />

          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <span className="text-xs font-body text-foreground bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
              Especialização em Psicologia Clínica
            </span>
            <span className="text-xs font-body text-foreground bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
              Terapia Cognitivo-Comportamental
            </span>
          </div>

          <div className="space-y-5 text-muted-foreground font-body text-base leading-relaxed text-center max-w-2xl mx-auto">
            <p>
              Sou psicóloga clínica com abordagem humanizada e acolhedora, com especialização em Psicologia Clínica e Terapia Cognitivo-Comportamental. 
              Meu compromisso é criar um espaço seguro onde você possa se expressar 
              livremente, sem julgamentos.
            </p>
            <p>
              Acredito que o autoconhecimento é a chave para uma vida mais equilibrada. 
              Cada pessoa é única, e por isso trabalho de forma personalizada, respeitando 
              seu tempo e suas vivências.
            </p>
            <p>
              Minha missão é te ajudar a encontrar clareza, fortalecer sua saúde emocional 
              e construir uma relação mais saudável consigo mesmo e com o mundo ao seu redor.
            </p>
          </div>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto"
        >
          {[
            { number: "01", title: "Acolhimento", desc: "Um espaço seguro e sem julgamentos onde você pode se expressar com liberdade." },
            { number: "02", title: "Autoconhecimento", desc: "Compreender seus padrões emocionais e descobrir novas formas de lidar com desafios." },
            { number: "03", title: "Transformação", desc: "Promover mudanças reais e duradouras na sua qualidade de vida e bem-estar." },
          ].map((item) => (
            <div key={item.number} className="text-center md:text-left">
              <span className="text-xs font-body text-primary font-medium tracking-wider">{item.number}</span>
              <h3 className="font-heading text-xl font-medium text-foreground mt-2 mb-3">{item.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default About;
