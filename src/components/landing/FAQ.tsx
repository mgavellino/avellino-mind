import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const items = [
  {
    q: "Os dados dos meus pacientes são seguros?",
    a: "Sim. Usamos criptografia ponta-a-ponta, servidores no Brasil, RLS no banco e auditoria completa. Conformidade total com a LGPD e CFP.",
  },
  {
    q: "Posso migrar meus pacientes do Psicloud ou outro sistema?",
    a: "Sim. Oferecemos importação assistida via CSV e API para todos os planos pagos. O onboarding dedicado está incluso no plano Anual.",
  },
  {
    q: "Como funciona o autosave do prontuário?",
    a: "Cada caractere digitado é persistido em tempo real com debounce inteligente. Você vê indicadores de 'salvando' e 'salvo' e nunca perde uma palavra — mesmo em quedas de conexão.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Cancelamento em um clique, sem multa. Seus dados ficam disponíveis para exportação por 90 dias após o cancelamento.",
  },
  {
    q: "O sistema funciona em celular e tablet?",
    a: "Totalmente responsivo. Atenda, agende e consulte prontuários de qualquer dispositivo com a mesma fluidez.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-28">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.2em] text-[oklch(0.68_0.20_245)]">
            Dúvidas
          </span>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-gradient-brand">
            Perguntas frequentes.
          </h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {items.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-xl border border-border/60 bg-surface/40 px-5 [&[data-state=open]]:bg-surface"
            >
              <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
