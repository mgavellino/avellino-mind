import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import alineFoto from "@/assets/landing/aline-foto.jpeg";

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative bg-secondary">
      <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-20 py-28">
        {/* Photo */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="flex-shrink-0"
        >
          <div className="w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-4 ring-offset-secondary">
            <img src={alineFoto} alt="Aline Dias - Psicóloga" className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center md:text-left space-y-6 max-w-lg"
        >
          <div>
            <p className="text-xs tracking-[0.35em] uppercase text-muted-foreground font-body font-medium mb-3">
              Psicóloga Clínica
            </p>
            <h1 className="text-5xl md:text-7xl font-heading font-medium text-foreground leading-tight">
              Aline<br />Dias
            </h1>
          </div>
          <p className="text-muted-foreground font-body text-base leading-relaxed">
            Cuidar da mente é o primeiro passo para uma vida mais leve. 
            Estou aqui para te acompanhar nessa jornada de autoconhecimento e bem-estar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a
              href="#contato"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-body font-medium text-sm tracking-wide hover:opacity-90 transition-opacity"
            >
              Agende sua consulta
            </a>
            <a
              href="#sobre"
              className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-8 py-3.5 rounded-full font-body font-medium text-sm tracking-wide hover:bg-muted transition-colors"
            >
              Saiba mais
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <a href="#sobre" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
};

export default Hero;
