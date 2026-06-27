import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  MapPin, Phone, MessageCircle, Star, ChevronDown, Clock, Video,
  Heart, Brain, Sparkles, Users, Shield, ArrowDown,
} from "lucide-react";

const SITE_URL = "https://avellpsy.lovable.app";
const PHONE_DISPLAY = "(31) 98822-6866";
const PHONE_E164 = "+5531988226866";
const WHATSAPP = `https://wa.me/5531988226866?text=${encodeURIComponent("Olá Aline, gostaria de agendar uma consulta.")}`;
const ADDRESS = "Rua Pará de Minas, 2000 - Sala 4, São Benedito, Santa Luzia - MG";
const MAPS = "https://www.google.com/maps?q=Rua%20Par%C3%A1%20de%20Minas%202000%2C%20S%C3%A3o%20Benedito%2C%20Santa%20Luzia%2C%20MG";

const SERVICES = [
  { t: "Terapia para Adultos", d: "Sessões personalizadas focadas nas suas necessidades, vivências e objetivos pessoais.", i: Heart },
  { t: "Ansiedade e Estresse", d: "Técnicas e estratégias para lidar com a ansiedade e recuperar a tranquilidade no dia a dia.", i: Brain },
  { t: "Atendimento a Adolescentes", d: "Acompanhamento sensível para adolescentes em momentos de transição, dúvidas e descobertas.", i: Users },
  { t: "Atendimento Online", d: "Sessões por videochamada com a mesma qualidade, de onde você estiver.", i: Video },
  { t: "Autoconhecimento", d: "Um caminho para entender seus padrões emocionais e tomar decisões mais conscientes.", i: Sparkles },
  { t: "Saúde Emocional", d: "Cuidar das emoções é essencial para uma vida equilibrada e com propósito.", i: Shield },
];

const TCC_GROUPS = [
  { t: "Ansiedade e regulação emocional", items: ["Ansiedade excessiva", "Crises de ansiedade ou pânico", "Dificuldade em lidar com emoções intensas", "Estresse e sobrecarga"] },
  { t: "Autoestima e padrões de pensamento", items: ["Baixa autoestima", "Autocrítica elevada", "Pensamentos negativos recorrentes", "Medo de rejeição ou abandono"] },
  { t: "Relacionamentos e vida familiar", items: ["Dificuldade em estabelecer limites", "Dependência emocional", "Conflitos familiares", "Comunicação difícil ou desgastante"] },
  { t: "Comportamentos e rotina", items: ["Procrastinação", "Dificuldade de organização", "Evitação de situações importantes", "Dificuldade em tomar decisões"] },
  { t: "Adolescentes", items: ["Ansiedade e insegurança", "Conflitos com pais", "Dificuldades sociais", "Desenvolvimento de autonomia"] },
  { t: "Saúde emocional e qualidade de vida", items: ["Insônia", "Estresse", "Sobrecarga emocional", "Equilíbrio entre rotina e autocuidado"] },
];

const TESTIMONIALS = [
  { n: "Miguel Avellino", d: "maio de 2026", t: "Aline foi extremamente importante no meu processo de autoconhecimento. Ela me ajudou a entender muitas coisas sobre mim que antes eu não conseguia explicar, além de me auxiliar no processo do meu diagnóstico com muita atenção e profissionalismo. As sessões sempre foram acolhedoras, leves e ao mesmo tempo muito profundas. Me senti ouvido de verdade e consegui evoluir bastante emocionalmente graças ao acompanhamento dela." },
  { n: "Erenice Miranda", d: "6 meses atrás", t: "Olha confesso que tinha um pouco de preconceito sobre a terapia, achava que não era pra mim, tipo eu não precisava, mas me sentindo muito mal no fundo do poço mesmo, resolvi fazer, e Deus colocou no meu caminho esta profissional." },
  { n: "Caroline Guimarães", d: "6 meses atrás", t: "Aline é uma profissional excepcional. Conduz o processo terapêutico com clareza, explicando de forma transparente cada etapa. Demonstra excelente organização com a agenda e comprometimento com o paciente." },
  { n: "Célia Avelino", d: "5 meses atrás", t: "A Dra. Aline é uma profissional excepcional, seu consultório super acolhedor. Amo ver meu filho sendo cuidado por ela. Super recomendo." },
  { n: "Vinicius Loredo", d: "6 meses atrás", t: "Excelente profissional! Está me ajudando muito no processo de autoconhecimento, em soluções de conflitos e controle da ansiedade. Sempre muito empática e acolhedora. Super indico a todos e todas o trabalho dela." },
  { n: "Dilma Sabino", d: "6 meses atrás", t: "Profissional maravilhosa, pontual comprometida com o trabalho, amei os cuidados e seu acolhimento." },
  { n: "Claudia Alves", d: "1 ano atrás", t: "Aline é uma pessoa muito abençoada por Deus na minha vida, e da minha filha. Num momento muito difícil na vida, em que estava me separando." },
  { n: "Julia Mello", d: "1 ano atrás", t: "Muito gentil, uma excelente profissional, confio 100% para indicar. Faço tratamento com a Aline já tem 2 anos e graças a ela venho melhorando constantemente e sinto uma gratidão imensa por ela." },
  { n: "Marine Lima", d: "2 anos atrás", t: "Aline é uma psicóloga muito humana e atenciosa, conseguiu me ajudar muito no meu processo e indico de olhos fechados para quem precisar. Sou muito grata pela sua forma de trabalhar e suas palavras durante minhas sessões. Excelente profissional!" },
  { n: "Katia Cássia", d: "2 anos atrás", t: "A Aline foi uma profissional importantíssima na minha vida e na vida de minha filha. Fundamental num momento muito difícil dela. Profissional de excelência." },
  { n: "Lurdiana Tiburcio", d: "2 anos atrás", t: "Aline é maravilhosa, desde o primeiro contato fui muito bem acolhida, me senti segura para me abrir com ela. Uma excelente profissional, sempre propondo reflexões assertivas e ensinando." },
  { n: "João Teles", d: "1 ano atrás", t: "Aline é uma excelente profissional, estávamos quase perdendo nossa filha, ela dedicou seu tempo, profissionalismo e muito carinho. Super recomendo!" },
  { n: "Gleisson Teologia", d: "2 anos atrás", t: "Sou grato à Aline pelo incrível impacto que ela teve em minha vida. Sua abordagem profissional e empática me proporcionou um espaço seguro para explorar meus conflitos mentais." },
  { n: "Elisangela Assis Rosa", d: "1 ano atrás", t: "Aline foi uma excelente psicóloga, me ajudou no momento mais difícil de minha vida, me acolheu com todo carinho e amor. Sou muito grata a Deus pela vida da Aline, excelente profissional." },
  { n: "Larissa Camargos", d: "2 anos atrás", t: "Fui paciente da Aline em um momento muito difícil da minha vida, ela me ajudou muito no processo de aceitação e amor próprio. Tenho um carinho enorme por ela e por toda ajuda que me deu nesse tempo." },
  { n: "Júlia Rodrigues", d: "1 ano atrás", t: "Sempre tive muita dificuldade em me abrir para algum psicólogo, a Aline foi a única que consegui me adaptar, muito muito boa. Indico para todos de olhos fechados." },
  { n: "Flavy Santos", d: "2 anos atrás", t: "Aline é uma profissional maravilhosa, me ajudou e continua ajudando muito, muito atenciosa e simpática, sou grata a Deus pela vida dela, super recomendo." },
  { n: "Eliana Aniceto", d: "2 anos atrás", t: "Meu filho fez acompanhamento com ela por quase 3 anos, a Aline é uma pessoa super profissional, atenciosa, humana. Super recomendo." },
  { n: "Valter Maciel", d: "6 meses atrás", t: "Um excelente atendimento e uma excelente profissional, super indico." },
  { n: "Mateus Eduardo", d: "1 ano atrás", t: "Faço acompanhamento, e não tenho nada a me queixar, na verdade só tenho elogios a fazer, tem me ajudado muito a organizar minha vida, lidar com problemas e emoções. Tem sido essencial para meu desenvolvimento pessoal." },
  { n: "Lara Julia", d: "1 ano atrás", t: "Aline é sempre muito doce e gentil… receptiva e carismática! Privilégio o meu ter uma profissional assim para me atender." },
  { n: "Matheus Torres", d: "2 anos atrás", t: "Só posso agradecer a Aline por todo o trabalho que tem feito comigo, seu profissionalismo é exemplar, realiza um atendimento acolhedor, empático, que cuidadosamente me permite dia após dia refletir sobre as questões que trabalhamos." },
  { n: "Sara Soares", d: "1 ano atrás", t: "Aline foi uma profissional incrível que me ajudou no meu processo, a melhor psicóloga." },
  { n: "Aline Freire", d: "2 anos atrás", t: "Aline é uma profissional de melhor qualidade. Dedicada, honesta e dominadora da área em que atua. Super recomendo!" },
  { n: "Aline Rodrigues", d: "2 anos atrás", t: "Atendimento sensacional, profissional super qualificada. Ambiente maravilhoso e perfeito para nos conectar. Super recomendo a Aline, ela transborda amor e carinho." },
  { n: "Gleice Rodrigues Batista", d: "1 ano atrás", t: "A Aline foi psicóloga da minha filha por mais de um ano, foi muito bom! É uma ótima psicóloga." },
  { n: "Raquel Santos", d: "2 anos atrás", t: "Excelente profissional. Capacitada com ótima formação para atender várias idades. Flexibilidade de horários. Muito atenciosa. Super recomendo." },
  { n: "Luiz Guilherme", d: "2 anos atrás", t: "Excelente profissional! Me ajudou e me ajuda muito até hoje. Sem dúvidas vale o investimento. Merece todo sucesso." },
  { n: "Thiago Ramos", d: "1 ano atrás", t: "Ótima profissional! Tem me ajudado muito." },
  { n: "Danielle Pires", d: "2 anos atrás", t: "Profissional muito competente. Respeita a individualidade do paciente. Acolhedora e eficiente." },
  { n: "Andre Braga", d: "2 anos atrás", t: "Excelente trabalho, um atendimento maravilhoso, atenta a cada detalhe, que possa nos ajudar." },
  { n: "Sirlei Ferreira", d: "2 anos atrás", t: "Uma excelente psicóloga, muito profissional!" },
  { n: "Júlia Souza", d: "5 meses atrás", t: "Maravilhosa!" },
  { n: "Dinoite BH", d: "1 ano atrás", t: "Top, gostei muito." },
];

const FAQS = [
  { q: "Como funciona a primeira sessão?", a: "A primeira sessão é um momento de acolhimento e escuta. Vamos conversar sobre o que te trouxe até aqui, suas expectativas e como posso te ajudar. É um espaço sem julgamentos para você se sentir à vontade." },
  { q: "Quanto tempo dura cada sessão?", a: "Cada sessão tem duração de aproximadamente 50 minutos, tempo suficiente para desenvolvermos as questões trazidas com profundidade e cuidado." },
  { q: "O atendimento online é tão eficaz quanto o presencial?", a: "Sim. Diversas pesquisas mostram que a psicoterapia online tem eficácia equivalente à presencial. O importante é o vínculo terapêutico e o seu engajamento no processo." },
  { q: "Com que frequência devo fazer terapia?", a: "Em geral as sessões são semanais, especialmente no início do processo. A frequência pode ser ajustada conforme suas necessidades e a evolução do tratamento." },
  { q: "As sessões são sigilosas?", a: "Sim. O sigilo é um dever ético e profissional garantido pelo Código de Ética do Psicólogo. Tudo o que é dito em sessão permanece em sessão." },
];

const PHOTOS = [
  { src: "/landing/consultorio-1.jpg", alt: "Sala de espera com poltronas e quadro 'Tudo que a gente cuida floresce'" },
  { src: "/landing/consultorio-3.jpg", alt: "Sala de atendimento com sofá e poltrona azul" },
  { src: "/landing/consultorio-2.jpg", alt: "Cantinho aconchegante do consultório" },
  { src: "/landing/consultorio-4.jpg", alt: "Espaço de escritório do consultório" },
  { src: "/landing/consultorio-5.jpg", alt: "Cantinho do café para clientes" },
];

const RATING_VALUE = 5.0;
const RATING_COUNT = 34;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["LocalBusiness", "MedicalBusiness", "ProfessionalService"],
      "@id": `${SITE_URL}/#business`,
      name: "Aline Dias — Psicóloga Clínica",
      image: `${SITE_URL}/landing/aline.jpg`,
      logo: `${SITE_URL}/aline-logo.jpg`,
      url: SITE_URL,
      telephone: PHONE_E164,
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Rua Pará de Minas, 2000 - Sala 4",
        addressLocality: "Santa Luzia",
        addressRegion: "MG",
        postalCode: "33115-000",
        addressCountry: "BR",
      },
      areaServed: [
        { "@type": "City", name: "Santa Luzia" },
        { "@type": "City", name: "Belo Horizonte" },
        { "@type": "Country", name: "Brasil" },
      ],
      sameAs: [],
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "20:00" },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: RATING_VALUE.toFixed(1),
        reviewCount: RATING_COUNT,
        bestRating: "5",
        worstRating: "1",
      },
      review: TESTIMONIALS.slice(0, 8).map((r) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
        author: { "@type": "Person", name: r.n },
        reviewBody: r.t,
      })),
      makesOffer: SERVICES.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.t, description: s.d },
      })),
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#aline`,
      name: "Aline Dias",
      jobTitle: "Psicóloga Clínica",
      worksFor: { "@id": `${SITE_URL}/#business` },
      image: `${SITE_URL}/landing/aline.jpg`,
      url: SITE_URL,
      knowsAbout: ["Terapia Cognitivo-Comportamental", "Ansiedade", "Autoconhecimento", "Adolescentes", "Psicoterapia"],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Aline Dias — Psicóloga Clínica",
      inLanguage: "pt-BR",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      ],
    },
  ],
};

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Aline Dias — Psicóloga Clínica em Santa Luzia/MG | TCC, Online e Presencial" },
      {
        name: "description",
        content:
          "Psicóloga clínica em Santa Luzia/MG. Terapia Cognitivo-Comportamental (TCC) para adultos e adolescentes — ansiedade, autoconhecimento e saúde emocional. Atendimento online e presencial.",
      },
      { name: "keywords", content: "psicóloga Santa Luzia, psicólogo Belo Horizonte, terapia cognitivo comportamental, TCC, psicoterapia online, Aline Dias psicóloga, ansiedade, autoconhecimento" },
      { name: "author", content: "Aline Dias" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "googlebot", content: "index, follow" },
      { name: "format-detection", content: "telephone=yes" },
      { name: "geo.region", content: "BR-MG" },
      { name: "geo.placename", content: "Santa Luzia" },
      { name: "geo.position", content: "-19.7697;-43.8517" },
      { name: "ICBM", content: "-19.7697, -43.8517" },

      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: "Aline Dias — Psicóloga" },
      { property: "og:title", content: "Aline Dias — Psicóloga Clínica em Santa Luzia/MG" },
      { property: "og:description", content: "Acolhimento, autoconhecimento e transformação. TCC para adultos e adolescentes — online e presencial." },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: `${SITE_URL}/landing/aline.jpg` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "1200" },
      { property: "og:image:alt", content: "Aline Dias — Psicóloga Clínica" },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Aline Dias — Psicóloga Clínica em Santa Luzia/MG" },
      { name: "twitter:description", content: "TCC para adultos e adolescentes — atendimento online e presencial." },
      { name: "twitter:image", content: `${SITE_URL}/landing/aline.jpg` },
    ],
    links: [
      { rel: "canonical", href: SITE_URL },
      { rel: "preload", as: "image", href: "/landing/aline.jpg" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(jsonLd) },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <TCC />
        <Space />
        <Location />
        <Reviews />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    { h: "#sobre", l: "Sobre" },
    { h: "#servicos", l: "Serviços" },
    { h: "#tcc", l: "TCC" },
    { h: "#espaco", l: "Espaço" },
    { h: "#duvidas", l: "Dúvidas" },
    { h: "#contato", l: "Contato" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/aline-logo.jpg" alt="Aline Dias Psicóloga" width={36} height={36} className="rounded-full ring-1 ring-border/60 object-cover" />
          <span className="font-display text-lg tracking-tight">Aline Dias</span>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-[13px] uppercase tracking-widest text-muted-foreground" aria-label="Navegação principal">
          {links.map((l) => (
            <a key={l.h} href={l.h} className="hover:text-foreground transition-colors">{l.l}</a>
          ))}
        </nav>
        <button onClick={() => setOpen(!open)} className="md:hidden h-10 w-10 grid place-items-center rounded-md hover:bg-surface" aria-label="Menu">
          <div className="space-y-1.5">
            <span className="block h-px w-5 bg-foreground" />
            <span className="block h-px w-5 bg-foreground" />
            <span className="block h-px w-5 bg-foreground" />
          </div>
        </button>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border/40 bg-background" aria-label="Navegação mobile">
          <div className="px-4 py-2 flex flex-col">
            {links.map((l) => (
              <a key={l.h} href={l.h} onClick={() => setOpen(false)} className="py-3 text-sm uppercase tracking-widest text-muted-foreground border-b border-border/30 last:border-0">{l.l}</a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-32 -right-24 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent-warm) 0%, transparent 70%)" }} />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24 md:pt-28 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Psicóloga Clínica</p>
          <h1 className="font-display text-5xl md:text-7xl font-medium leading-[1.05] mt-3">
            Aline <br /> Dias
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
            Cuidar da mente é o primeiro passo para uma vida mais leve. Estou aqui para te acompanhar nessa jornada de autoconhecimento e bem-estar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contato" className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-brand text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              Agende sua consulta
            </a>
            <a href="#sobre" className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-border hover:bg-surface text-sm font-medium transition-colors">
              Saiba mais
            </a>
          </div>
        </div>
        <div className="order-1 md:order-2 flex justify-center md:justify-end">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-brand/15 to-accent-warm/15 blur-xl" aria-hidden />
            <img
              src="/landing/aline.jpg"
              alt="Aline Dias — Psicóloga Clínica"
              width={420}
              height={420}
              fetchPriority="high"
              className="relative h-[280px] w-[280px] md:h-[420px] md:w-[420px] rounded-full object-cover ring-4 ring-background shadow-elevated"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center pb-10 text-muted-foreground" aria-hidden>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="text-[11px] uppercase tracking-[0.3em] text-brand">{children}</p>;
}

function About() {
  return (
    <section id="sobre" className="py-20 md:py-28 bg-surface/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionLabel>Sobre mim</SectionLabel>
        <h2 className="mt-3 font-display text-3xl md:text-5xl leading-tight max-w-3xl">
          Acredito que toda pessoa merece ser ouvida
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center h-7 px-3 rounded-full bg-brand/10 text-brand text-xs">Especialização em Psicologia Clínica</span>
          <span className="inline-flex items-center h-7 px-3 rounded-full bg-brand/10 text-brand text-xs">Terapia Cognitivo-Comportamental</span>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-10">
          <div className="space-y-5 text-muted-foreground leading-relaxed">
            <p>Sou psicóloga clínica com abordagem humanizada e acolhedora, com especialização em Psicologia Clínica e Terapia Cognitivo-Comportamental. Meu compromisso é criar um espaço seguro onde você possa se expressar livremente, sem julgamentos.</p>
            <p>Acredito que o autoconhecimento é a chave para uma vida mais equilibrada. Cada pessoa é única, e por isso trabalho de forma personalizada, respeitando seu tempo e suas vivências.</p>
            <p>Minha missão é te ajudar a encontrar clareza, fortalecer sua saúde emocional e construir uma relação mais saudável consigo mesmo e com o mundo ao seu redor.</p>
          </div>
          <div className="grid gap-4">
            {[
              { n: "01", t: "Acolhimento", d: "Um espaço seguro e sem julgamentos onde você pode se expressar com liberdade." },
              { n: "02", t: "Autoconhecimento", d: "Compreender seus padrões emocionais e descobrir novas formas de lidar com desafios." },
              { n: "03", t: "Transformação", d: "Promover mudanças reais e duradouras na sua qualidade de vida e bem-estar." },
            ].map((p) => (
              <div key={p.n} className="rounded-2xl border border-border/50 bg-card p-6">
                <div className="text-xs text-muted-foreground tracking-widest">{p.n}</div>
                <h3 className="mt-1 font-display text-xl">{p.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="servicos" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionLabel>Serviços</SectionLabel>
        <h2 className="mt-3 font-display text-3xl md:text-5xl leading-tight">Áreas de Atendimento</h2>
        <p className="mt-3 text-muted-foreground">Psicoterapia para pessoas a partir de 14 anos.</p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s) => {
            const Icon = s.i;
            return (
              <article key={s.t} className="group rounded-2xl border border-border/50 bg-card p-7 hover:shadow-elevated transition-shadow">
                <div className="h-11 w-11 rounded-xl bg-brand/10 text-brand grid place-items-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TCC() {
  return (
    <section id="tcc" className="py-20 md:py-28 bg-surface/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionLabel>Abordagem</SectionLabel>
        <h2 className="mt-3 font-display text-3xl md:text-5xl leading-tight max-w-3xl">
          O que é a Terapia Cognitivo-Comportamental?
        </h2>
        <div className="mt-8 grid md:grid-cols-2 gap-10 text-muted-foreground leading-relaxed">
          <div className="space-y-4">
            <p>A Terapia Cognitivo-Comportamental (TCC) é uma abordagem psicológica baseada em evidências científicas, que busca compreender como nossos pensamentos, emoções e comportamentos estão interligados.</p>
            <p>A TCC parte do princípio de que a forma como interpretamos as situações influencia diretamente como nos sentimos e como agimos. Muitas vezes, desenvolvemos padrões de pensamento automáticos e crenças que podem gerar sofrimento, ansiedade ou dificuldades nos relacionamentos.</p>
          </div>
          <div className="space-y-4">
            <p>Durante o processo terapêutico, trabalhamos juntos para identificar esses padrões, desenvolver formas mais saudáveis de pensar e construir estratégias práticas para lidar com os desafios do dia a dia.</p>
            <p>É uma abordagem estruturada, colaborativa e focada no presente, com resultados consistentes no tratamento de diversas demandas emocionais.</p>
          </div>
        </div>

        <h3 className="mt-16 font-display text-2xl md:text-3xl">Quais demandas a TCC pode ajudar?</h3>
        <p className="mt-2 text-muted-foreground">Atendimento para adolescentes e adultos em diferentes momentos da vida, auxiliando em questões como:</p>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TCC_GROUPS.map((g) => (
            <article key={g.t} className="rounded-2xl border border-border/50 bg-card p-6">
              <h4 className="font-display text-lg">{g.t}</h4>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {g.items.map((it) => (
                  <li key={it} className="flex gap-2"><span className="text-brand">·</span>{it}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-border/50 bg-card p-7 md:p-10">
          <h3 className="font-display text-2xl">Como funciona o atendimento?</h3>
          <div className="mt-4 space-y-3 text-muted-foreground leading-relaxed">
            <p>O atendimento é individual, realizado de forma presencial ou online, em um espaço acolhedor, ético e sigiloso.</p>
            <p>Cada processo é único e respeita o ritmo e as necessidades de cada pessoa. O objetivo é promover mais autonomia, bem-estar emocional e qualidade de vida.</p>
            <p>Se você sente que precisa de ajuda para lidar com suas emoções, pensamentos ou relações, a terapia pode ser um caminho importante.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Space() {
  return (
    <section id="espaco" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionLabel>Conheça o espaço</SectionLabel>
        <h2 className="mt-3 font-display text-3xl md:text-5xl leading-tight max-w-3xl">
          Um lugar para você se sentir em casa
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Um ambiente acolhedor, ético e sigiloso, pensado para que você se sinta confortável durante todo o atendimento.
        </p>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {PHOTOS.map((p, i) => (
            <figure key={p.src} className={`relative overflow-hidden rounded-2xl ${i === 0 ? "md:col-span-2 md:row-span-2 aspect-square" : "aspect-square"}`}>
              <img src={p.src} alt={p.alt} loading="lazy" className="h-full w-full object-cover hover:scale-105 transition-transform duration-700" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Location() {
  return (
    <section id="local" className="py-20 md:py-28 bg-surface/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-12 items-start">
        <div>
          <SectionLabel>Onde me encontrar</SectionLabel>
          <h2 className="mt-3 font-display text-3xl md:text-5xl leading-tight">Localização do consultório</h2>
          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Endereço</h3>
              <p className="mt-2 text-base">{ADDRESS}</p>
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Atendimento online</h3>
              <p className="mt-2 text-base text-muted-foreground">Sessões por videochamada com a mesma qualidade e acolhimento, de onde você estiver.</p>
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground">Atendimento</h3>
              <p className="mt-2 text-base text-muted-foreground">Adolescentes e adultos. Agendamento mediante horário marcado.</p>
            </div>
            <a href={MAPS} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-brand text-primary-foreground text-sm font-medium hover:opacity-90">
              <MapPin className="h-4 w-4" /> Como chegar
            </a>
          </div>
        </div>
        <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-border/50 shadow-elevated">
          <iframe
            title="Mapa do consultório"
            src="https://www.google.com/maps?q=Rua%20Par%C3%A1%20de%20Minas%202000%2C%20S%C3%A3o%20Benedito%2C%20Santa%20Luzia%2C%20MG&output=embed"
            width="100%"
            height="100%"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: 0 }}
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? TESTIMONIALS : TESTIMONIALS.slice(0, 6);
  return (
    <section id="depoimentos" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionLabel>Depoimentos</SectionLabel>
        <h2 className="mt-3 font-display text-3xl md:text-5xl leading-tight">O que dizem sobre o atendimento</h2>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-5 w-5 fill-accent-warm text-accent-warm" />)}
          </div>
          <div className="text-sm"><strong>{RATING_VALUE.toFixed(1)}</strong> · {RATING_COUNT} avaliações</div>
        </div>

        <div className="mt-10 columns-1 md:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
          {visible.map((r) => (
            <figure key={r.n} className="break-inside-avoid mb-5 rounded-2xl border border-border/50 bg-card p-6">
              <div className="flex" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-accent-warm text-accent-warm" />)}
              </div>
              <blockquote className="mt-3 text-sm text-muted-foreground leading-relaxed">"{r.t}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-brand/15 text-brand grid place-items-center text-xs font-semibold">
                  {r.n.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">{r.n}</div>
                  <div className="text-xs text-muted-foreground">{r.d}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
        {!showAll && TESTIMONIALS.length > 6 && (
          <div className="mt-6 text-center">
            <button onClick={() => setShowAll(true)} className="inline-flex items-center h-11 px-6 rounded-full border border-border hover:bg-surface text-sm font-medium">
              Ver todos os {TESTIMONIALS.length} depoimentos
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="duvidas" className="py-20 md:py-28 bg-surface/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionLabel>Dúvidas</SectionLabel>
        <h2 className="mt-3 font-display text-3xl md:text-5xl leading-tight">Perguntas Frequentes</h2>
        <div className="mt-10 divide-y divide-border/60 border-y border-border/60">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left py-5 flex items-center justify-between gap-4 hover:text-brand transition-colors"
                aria-expanded={open === i}
              >
                <span className="font-medium text-base">{f.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <p className="pb-6 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contato" className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <SectionLabel>Contato</SectionLabel>
        <h2 className="mt-3 font-display text-3xl md:text-5xl leading-tight">Vamos conversar?</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Dê o primeiro passo para o seu bem-estar. Entre em contato pelo WhatsApp e agende sua consulta. Terei o prazer de te receber.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-brand text-primary-foreground text-base font-medium hover:opacity-90 shadow-elevated">
            <MessageCircle className="h-5 w-5" /> Falar pelo WhatsApp
          </a>
          <a href={`tel:${PHONE_E164}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
          </a>
          <p className="text-xs text-muted-foreground">Atendimento Online e Presencial</p>
        </div>
      </div>

      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-brand text-primary-foreground grid place-items-center shadow-elevated hover:scale-105 transition-transform"
        aria-label="Falar pelo WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src="/aline-logo.jpg" alt="" width={24} height={24} className="rounded-full" />
          <span>© {new Date().getFullYear()} Aline Dias · Psicóloga Clínica</span>
        </div>
        <div className="flex items-center gap-4">
          <a href={MAPS} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
            <MapPin className="h-3 w-3" /> Santa Luzia/MG
          </a>
          <Link to="/login" className="hover:text-foreground">Área restrita</Link>
        </div>
      </div>
    </footer>
  );
}
