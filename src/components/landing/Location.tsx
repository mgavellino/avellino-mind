import { motion } from "framer-motion";
import { MapPin, Monitor, Clock } from "lucide-react";

const ADDRESS = "Rua Pará de Minas, 2000 - Sala 4, São Benedito, Santa Luzia - MG";
const MAPS_QUERY = encodeURIComponent("Rua Pará de Minas 2000, São Benedito, Santa Luzia, MG");
const MAPS_EMBED = `https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`;
const MAPS_LINK = `https://www.google.com/maps?q=${MAPS_QUERY}`;

const Location = () => {
  return (
    <section id="localizacao" className="py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.35em] uppercase text-primary font-body font-medium mb-4">
            Onde me encontrar
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-medium text-foreground mb-4 leading-snug">
            Localização do consultório
          </h2>
          <div className="w-12 h-px bg-accent mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto items-stretch">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-secondary rounded-2xl p-8 md:p-10 flex flex-col justify-between"
          >
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-medium text-foreground mb-1">Endereço</h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">{ADDRESS}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-medium text-foreground mb-1">Atendimento online</h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">
                    Sessões por videochamada com a mesma qualidade e acolhimento, de onde você estiver.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-medium text-foreground mb-1">Atendimento</h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">
                    Adolescentes e adultos. Agendamento mediante horário marcado.
                  </p>
                </div>
              </div>
            </div>

            <a
              href={MAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-body font-medium text-sm tracking-wide hover:opacity-90 transition-opacity self-start"
            >
              Como chegar
            </a>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl overflow-hidden border border-border min-h-[360px] lg:min-h-0"
          >
            <iframe
              title="Mapa do consultório"
              src={MAPS_EMBED}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 360 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Location;
