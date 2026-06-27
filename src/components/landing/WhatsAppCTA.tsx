import { motion } from "framer-motion";
import { MessageCircle, Phone, MapPin } from "lucide-react";
import ContactFormDialog from "./ContactFormDialog";

const WhatsAppCTA = () => {
  return (
    <section id="contato" className="py-28 bg-secondary">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="text-xs tracking-[0.35em] uppercase text-primary font-body font-medium mb-4">
            Contato
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-medium text-foreground mb-4 leading-snug">
            Vamos conversar?
          </h2>
          <div className="w-12 h-px bg-accent mx-auto mb-8" />
          <p className="text-muted-foreground font-body text-base leading-relaxed mb-10">
            Dê o primeiro passo para o seu bem-estar. Entre em contato pelo WhatsApp 
            e agende sua consulta. Terei o prazer de te receber.
          </p>

          <ContactFormDialog
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-10 py-4 rounded-full font-body font-medium text-sm tracking-wide hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-5 h-5" />
                Falar pelo WhatsApp
              </button>
            }
          />

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-muted-foreground font-body text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <span>(31) 98822-6866</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Atendimento Online e Presencial</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating WhatsApp button */}
      <ContactFormDialog
        trigger={
          <button
            type="button"
            aria-label="WhatsApp"
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </button>
        }
      />
    </section>
  );
};

export default WhatsAppCTA;
