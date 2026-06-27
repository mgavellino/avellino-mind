import { motion } from "framer-motion";
import { User, Brain, Heart, Monitor, Lightbulb, ShieldCheck } from "lucide-react";

const services = [
  { icon: User, title: "Terapia para Adultos", desc: "Sessões personalizadas focadas nas suas necessidades, vivências e objetivos pessoais." },
  { icon: Brain, title: "Ansiedade e Estresse", desc: "Técnicas e estratégias para lidar com a ansiedade e recuperar a tranquilidade no dia a dia." },
  { icon: Heart, title: "Atendimento a Adolescentes", desc: "Acompanhamento sensível para adolescentes em momentos de transição, dúvidas e descobertas." },
  { icon: Monitor, title: "Atendimento Online", desc: "Sessões por videochamada com a mesma qualidade, de onde você estiver." },
  { icon: Lightbulb, title: "Autoconhecimento", desc: "Um caminho para entender seus padrões emocionais e tomar decisões mais conscientes." },
  { icon: ShieldCheck, title: "Saúde Emocional", desc: "Cuidar das emoções é essencial para uma vida equilibrada e com propósito." },
];

const Services = () => {
  return (
    <section id="servicos" className="py-28 bg-secondary">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.35em] uppercase text-primary font-body font-medium mb-4">
            Serviços
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-medium text-foreground mb-4 leading-snug">
            Áreas de Atendimento
          </h2>
          <div className="w-12 h-px bg-accent mx-auto mb-6" />
          <p className="text-muted-foreground font-body text-sm md:text-base max-w-xl mx-auto">
            Psicoterapia para pessoas a partir de <span className="text-foreground font-medium">14 anos</span>.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group bg-background rounded-2xl p-7 border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-medium text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
