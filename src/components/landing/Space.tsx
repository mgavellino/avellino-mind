import { motion } from "framer-motion";
import foto1 from "@/assets/landing/consultorio-1.jpeg";
import foto2 from "@/assets/landing/consultorio-2.jpeg";
import foto3 from "@/assets/landing/consultorio-3.jpeg";
import foto4 from "@/assets/landing/consultorio-4.jpeg";
import foto5 from "@/assets/landing/consultorio-5.jpeg";

const photos = [
  { src: foto1, alt: "Sala de espera com poltronas e quadro 'Tudo que a gente cuida floresce'" },
  { src: foto3, alt: "Sala de atendimento com sofá e poltrona azul" },
  { src: foto2, alt: "Cantinho aconchegante do consultório" },
  { src: foto4, alt: "Espaço de escritório do consultório" },
  { src: foto5, alt: "Cantinho do café para clientes" },
];

const Space = () => {
  return (
    <section id="espaco" className="py-28 bg-secondary">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.35em] uppercase text-primary font-body font-medium mb-4">
            Conheça o espaço
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-medium text-foreground mb-4 leading-snug">
            Um lugar para você se sentir em casa
          </h2>
          <div className="w-12 h-px bg-accent mx-auto mb-6" />
          <p className="text-muted-foreground font-body text-sm md:text-base max-w-xl mx-auto">
            Um ambiente acolhedor, ético e sigiloso, pensado para que você se sinta confortável durante todo o atendimento.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
          {photos.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`overflow-hidden rounded-2xl border border-border ${
                i === 0 ? "col-span-2 row-span-2 md:col-span-2 md:row-span-2" : ""
              }`}
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="w-full h-full object-cover aspect-[3/4] md:aspect-square hover:scale-105 transition-transform duration-700"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Space;
