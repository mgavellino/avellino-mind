import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Como funciona a primeira sessão?",
    a: "A primeira sessão é um momento de acolhimento e escuta. Vamos conversar sobre o que te trouxe até aqui, suas expectativas e como posso te ajudar. É um espaço sem julgamentos para você se sentir à vontade."
  },
  {
    q: "Quanto tempo dura cada sessão?",
    a: "Cada sessão tem duração de aproximadamente 50 minutos, seguindo o padrão clínico de atendimento psicológico."
  },
  {
    q: "O atendimento online é tão eficaz quanto o presencial?",
    a: "Sim! Diversos estudos comprovam que a terapia online tem a mesma eficácia do atendimento presencial. O importante é que você esteja em um ambiente tranquilo e privado."
  },
  {
    q: "Com que frequência devo fazer terapia?",
    a: "Geralmente recomendo sessões semanais, especialmente no início. Com o tempo, podemos ajustar a frequência conforme sua necessidade e evolução."
  },
  {
    q: "As sessões são sigilosas?",
    a: "Absolutamente. O sigilo é um princípio fundamental da psicologia. Tudo o que for conversado nas sessões é confidencial, conforme o Código de Ética do Psicólogo."
  },
];

const FAQItem = ({ q, a, isOpen, toggle }: { q: string; a: string; isOpen: boolean; toggle: () => void }) => (
  <div className="border-b border-border last:border-0">
    <button
      onClick={toggle}
      className="w-full flex items-center justify-between py-5 text-left gap-4"
    >
      <span className="font-body text-sm font-medium text-foreground">{q}</span>
      {isOpen ? (
        <Minus className="w-4 h-4 text-primary flex-shrink-0" />
      ) : (
        <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <p className="text-muted-foreground font-body text-sm leading-relaxed pb-5 pr-8">
        {a}
      </p>
    )}
  </div>
);

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto"
        >
          <p className="text-xs tracking-[0.35em] uppercase text-primary font-body font-medium mb-4 text-center">
            Dúvidas
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-medium text-foreground mb-4 text-center leading-snug">
            Perguntas Frequentes
          </h2>
          <div className="w-12 h-px bg-accent mx-auto mb-12" />

          <div>
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                q={faq.q}
                a={faq.a}
                isOpen={openIndex === i}
                toggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
