import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, Send } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;

type Review = {
  id: string;
  nome: string;
  estrelas: number;
  comentario: string;
  data: string;
};

const STORAGE_KEY = "aline-depoimentos-v2-migrated";

// Depoimentos reais do Google Maps
const seedReviews: Review[] = [
  { id: "seed-1", nome: "Erenice Miranda", estrelas: 5, data: "6 meses atrás", comentario: "Olha confesso que tinha um pouco de preconceito sobre a terapia, achava que não era pra mim, tipo eu não precisava, mas me sentindo muito mal no fundo do poço mesmo, resolvi fazer, e Deus colocou no meu caminho esta profissional." },
  { id: "seed-2", nome: "Caroline Guimarães", estrelas: 5, data: "6 meses atrás", comentario: "Aline é uma profissional excepcional. Conduz o processo terapêutico com clareza, explicando de forma transparente cada etapa. Demonstra excelente organização com a agenda e comprometimento com o paciente." },
  { id: "seed-3", nome: "Célia Avelino", estrelas: 5, data: "5 meses atrás", comentario: "A Dra. Aline é uma profissional excepcional, seu consultório super acolhedor. Amo ver meu filho sendo cuidado por ela. Super recomendo." },
  { id: "seed-4", nome: "Vinicius Loredo", estrelas: 5, data: "6 meses atrás", comentario: "Excelente profissional! Está me ajudando muito no processo de autoconhecimento, em soluções de conflitos e controle da ansiedade. Sempre muito empática e acolhedora. Super indico a todos e todas o trabalho dela." },
  { id: "seed-5", nome: "Dilma Sabino", estrelas: 5, data: "6 meses atrás", comentario: "Profissional maravilhosa, pontual comprometida com o trabalho, amei os cuidados e seu acolhimento." },
  { id: "seed-6", nome: "Claudia Alves", estrelas: 5, data: "1 ano atrás", comentario: "Aline é uma pessoa muito abençoada por Deus na minha vida, e da minha filha. Num momento muito difícil na vida, em que estava me separando." },
  { id: "seed-7", nome: "Julia Mello", estrelas: 5, data: "1 ano atrás", comentario: "Muito gentil, uma excelente profissional, confio 100% para indicar. Faço tratamento com a Aline já tem 2 anos e graças a ela venho melhorando constantemente e sinto uma gratidão imensa por ela." },
  { id: "seed-8", nome: "Marine Lima", estrelas: 5, data: "2 anos atrás", comentario: "Aline é uma psicóloga muito humana e atenciosa, conseguiu me ajudar muito no meu processo e indico de olhos fechados para quem precisar. Sou muito grata pela sua forma de trabalhar e suas palavras durante minhas sessões. Excelente profissional!" },
  { id: "seed-9", nome: "Katia Cássia", estrelas: 5, data: "2 anos atrás", comentario: "A Aline foi uma profissional importantíssima na minha vida e na vida de minha filha. Fundamental num momento muito difícil dela. Profissional de excelência." },
  { id: "seed-10", nome: "Lurdiana Tiburcio", estrelas: 5, data: "2 anos atrás", comentario: "Aline é maravilhosa, desde o primeiro contato fui muito bem acolhida, me senti segura para me abrir com ela. Uma excelente profissional, sempre propondo reflexões assertivas e ensinando." },
  { id: "seed-11", nome: "João Teles", estrelas: 5, data: "1 ano atrás", comentario: "Aline é uma excelente profissional, estávamos quase perdendo nossa filha, ela dedicou seu tempo, profissionalismo e muito carinho. Super recomendo!" },
  { id: "seed-12", nome: "Gleisson Teologia", estrelas: 5, data: "2 anos atrás", comentario: "Sou grato à Aline pelo incrível impacto que ela teve em minha vida. Sua abordagem profissional e empática me proporcionou um espaço seguro para explorar meus conflitos mentais." },
  { id: "seed-13", nome: "Elisangela Assis Rosa", estrelas: 5, data: "1 ano atrás", comentario: "Aline foi uma excelente psicóloga, me ajudou no momento mais difícil de minha vida, me acolheu com todo carinho e amor. Sou muito grata a Deus pela vida da Aline, excelente profissional." },
  { id: "seed-14", nome: "Larissa Camargos", estrelas: 5, data: "2 anos atrás", comentario: "Fui paciente da Aline em um momento muito difícil da minha vida, ela me ajudou muito no processo de aceitação e amor próprio. Tenho um carinho enorme por ela e por toda ajuda que me deu nesse tempo." },
  { id: "seed-15", nome: "Júlia Rodrigues", estrelas: 5, data: "1 ano atrás", comentario: "Sempre tive muita dificuldade em me abrir para algum psicólogo, a Aline foi a única que consegui me adaptar, muito muito boa. Indico para todos de olhos fechados." },
  { id: "seed-16", nome: "Flavy Santos", estrelas: 5, data: "2 anos atrás", comentario: "Aline é uma profissional maravilhosa, me ajudou e continua ajudando muito, muito atenciosa e simpática, sou grata a Deus pela vida dela, super recomendo." },
  { id: "seed-17", nome: "Eliana Aniceto", estrelas: 5, data: "2 anos atrás", comentario: "Meu filho fez acompanhamento com ela por quase 3 anos, a Aline é uma pessoa super profissional, atenciosa, humana. Super recomendo." },
  { id: "seed-18", nome: "Valter Maciel", estrelas: 5, data: "6 meses atrás", comentario: "Um excelente atendimento e uma excelente profissional, super indico." },
  { id: "seed-19", nome: "Mateus Eduardo", estrelas: 5, data: "1 ano atrás", comentario: "Faço acompanhamento, e não tenho nada a me queixar, na verdade só tenho elogios a fazer, tem me ajudado muito a organizar minha vida, lidar com problemas e emoções. Tem sido essencial para meu desenvolvimento pessoal." },
  { id: "seed-20", nome: "Lara Julia", estrelas: 5, data: "1 ano atrás", comentario: "Aline é sempre muito doce e gentil… receptiva e carismática! Privilégio o meu ter uma profissional assim para me atender." },
  { id: "seed-21", nome: "Matheus Torres", estrelas: 5, data: "2 anos atrás", comentario: "Só posso agradecer a Aline por todo o trabalho que tem feito comigo, seu profissionalismo é exemplar, realiza um atendimento acolhedor, empático, que cuidadosamente me permite dia após dia refletir sobre as questões que trabalhamos." },
  { id: "seed-22", nome: "Sara Soares", estrelas: 5, data: "1 ano atrás", comentario: "Aline foi uma profissional incrível que me ajudou no meu processo, a melhor psicóloga." },
  { id: "seed-23", nome: "Aline Freire", estrelas: 5, data: "2 anos atrás", comentario: "Aline é uma profissional de melhor qualidade. Dedicada, honesta e dominadora da área em que atua. Super recomendo!" },
  { id: "seed-24", nome: "Aline Rodrigues", estrelas: 5, data: "2 anos atrás", comentario: "Atendimento sensacional, profissional super qualificada. Ambiente maravilhoso e perfeito para nos conectar. Super recomendo a Aline, ela transborda amor e carinho." },
  { id: "seed-25", nome: "Gleice Rodrigues Batista", estrelas: 5, data: "1 ano atrás", comentario: "A Aline foi psicóloga da minha filha por mais de um ano, foi muito bom! É uma ótima psicóloga." },
  { id: "seed-26", nome: "Raquel Santos", estrelas: 5, data: "2 anos atrás", comentario: "Excelente profissional. Capacitada com ótima formação para atender várias idades. Flexibilidade de horários. Muito atenciosa. Super recomendo." },
  { id: "seed-27", nome: "Luiz Guilherme", estrelas: 5, data: "2 anos atrás", comentario: "Excelente profissional! Me ajudou e me ajuda muito até hoje. Sem dúvidas vale o investimento. Merece todo sucesso." },
  { id: "seed-28", nome: "Thiago Ramos", estrelas: 5, data: "1 ano atrás", comentario: "Ótima profissional! Tem me ajudado muito." },
  { id: "seed-29", nome: "Danielle Pires", estrelas: 5, data: "2 anos atrás", comentario: "Profissional muito competente. Respeita a individualidade do paciente. Acolhedora e eficiente." },
  { id: "seed-30", nome: "Andre Braga", estrelas: 5, data: "2 anos atrás", comentario: "Excelente trabalho, um atendimento maravilhoso, atenta a cada detalhe, que possa nos ajudar." },
  { id: "seed-31", nome: "Sirlei Ferreira", estrelas: 5, data: "2 anos atrás", comentario: "Uma excelente psicóloga, muito profissional!" },
  { id: "seed-32", nome: "Júlia Souza", estrelas: 5, data: "5 meses atrás", comentario: "Maravilhosa!" },
  { id: "seed-33", nome: "Dinoite BH", estrelas: 5, data: "1 ano atrás", comentario: "Top, gostei muito." },
];

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(60),
  estrelas: z.number().min(1, "Escolha de 1 a 5 estrelas").max(5),
  comentario: z.string().trim().min(10, "Conte um pouco mais (mín. 10 caracteres)").max(500),
});

const Stars = ({
  value,
  onChange,
  size = "w-6 h-6",
  interactive = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
  interactive?: boolean;
}) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onChange?.(n)}
            className={`${interactive ? "cursor-pointer" : "cursor-default"} transition-transform ${interactive ? "hover:scale-110" : ""}`}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          >
            <Star
              className={`${size} ${filled ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
            />
          </button>
        );
      })}
    </div>
  );
};

const Testimonials = () => {
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [form, setForm] = useState({ nome: "", estrelas: 0, comentario: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data, error } = await sb
        .from("depoimentos")
        .select("id, nome, estrelas, comentario, created_at")
        .order("created_at", { ascending: false });
      if (error || !data) return;
      const fromDb: Review[] = data.map((d: any) => ({
        id: d.id,
        nome: d.nome,
        estrelas: d.estrelas,
        comentario: d.comentario,
        data: new Date(d.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      }));
      setReviews([...fromDb, ...seedReviews]);
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    const { data, error } = await sb
      .from("depoimentos")
      .insert({
        nome: result.data.nome,
        estrelas: result.data.estrelas,
        comentario: result.data.comentario,
      })
      .select("id, nome, estrelas, comentario, created_at")
      .single();

    if (error || !data) {
      toast.error("Não foi possível publicar", { description: "Tente novamente em instantes." });
      return;
    }

    const newReview: Review = {
      id: data.id,
      nome: data.nome,
      estrelas: data.estrelas,
      comentario: data.comentario,
      data: new Date(data.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
    setReviews([newReview, ...reviews]);
    setForm({ nome: "", estrelas: 0, comentario: "" });
    toast.success("Obrigada pelo seu depoimento! 💛", { description: "Sua avaliação foi publicada." });
  };

  const media =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.estrelas, 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <section id="depoimentos" className="py-28 bg-secondary">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.35em] uppercase text-primary font-body font-medium mb-4">
            Depoimentos
          </p>
          <h2 className="text-3xl md:text-5xl font-heading font-medium text-foreground mb-4 leading-snug">
            O que dizem sobre o atendimento
          </h2>
          <div className="w-12 h-px bg-accent mx-auto mb-6" />

          <div className="inline-flex items-center gap-3 bg-background px-5 py-2.5 rounded-full border border-border">
            <Stars value={Math.round(parseFloat(media))} size="w-4 h-4" />
            <span className="font-body text-sm text-foreground">
              <strong>{media}</strong> · {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Lista de depoimentos */}
          <div className="lg:col-span-2 space-y-5">
            <AnimatePresence>
              {reviews.map((r, i) => (
                <motion.article
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="bg-background rounded-2xl p-6 md:p-7 border border-border relative"
                >
                  <Quote className="absolute top-5 right-5 w-8 h-8 text-primary/10" />
                  <Stars value={r.estrelas} size="w-4 h-4" />
                  <p className="font-body text-foreground/90 text-sm md:text-base leading-relaxed mt-3 mb-4">
                    "{r.comentario}"
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t border-border">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading text-sm font-medium">
                      {r.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-heading text-sm font-medium text-foreground">{r.nome}</p>
                      <p className="text-xs text-muted-foreground font-body">{r.data}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          {/* Formulário */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-background rounded-2xl p-6 md:p-7 border border-border h-fit lg:sticky lg:top-24"
          >
            <h3 className="font-heading text-xl font-medium text-foreground mb-2">
              Deixe seu depoimento
            </h3>
            <p className="text-sm text-muted-foreground font-body mb-6">
              Sua experiência ajuda outras pessoas a buscarem ajuda.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Sua avaliação</Label>
                <Stars
                  value={form.estrelas}
                  onChange={(v) => setForm({ ...form, estrelas: v })}
                  interactive
                />
                {errors.estrelas && <p className="text-xs text-destructive">{errors.estrelas}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="t-nome">Nome</Label>
                <Input
                  id="t-nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Seu nome"
                  maxLength={60}
                />
                {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="t-coment">Comentário</Label>
                <Textarea
                  id="t-coment"
                  value={form.comentario}
                  onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                  placeholder="Como foi sua experiência?"
                  maxLength={500}
                  rows={4}
                />
                {errors.comentario && <p className="text-xs text-destructive">{errors.comentario}</p>}
              </div>

              <Button type="submit" className="w-full gap-2 rounded-full">
                <Send className="w-4 h-4" />
                Publicar depoimento
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
