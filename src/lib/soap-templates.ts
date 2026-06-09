// TipTap JSON templates para evolução de sessão

type Doc = { type: "doc"; content: object[] };

const h = (level: number, text: string) => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});
const p = (text = "") => ({
  type: "paragraph",
  content: text ? [{ type: "text", text }] : [],
});
const hr = () => ({ type: "horizontalRule" });

export type TemplateKey = "soap" | "darn" | "girp" | "anamnese" | "alta";

export const TEMPLATES: { key: TemplateKey; label: string; description: string; build: () => Doc }[] = [
  {
    key: "soap",
    label: "SOAP",
    description: "Subjetivo · Objetivo · Avaliação · Plano",
    build: () => ({
      type: "doc",
      content: [
        h(2, `Evolução — ${new Date().toLocaleDateString("pt-BR")}`),
        h(3, "S — Subjetivo"),
        p("Relato da paciente, queixa principal, contexto da semana."),
        h(3, "O — Objetivo"),
        p("Observação clínica: humor, afeto, fala, comportamento, aparência."),
        h(3, "A — Avaliação"),
        p("Hipóteses, formulação, evolução em relação às sessões anteriores."),
        h(3, "P — Plano"),
        p("Intervenções utilizadas, tarefas, próximos passos, técnicas indicadas."),
      ],
    }),
  },
  {
    key: "darn",
    label: "DARN-CAT",
    description: "Entrevista motivacional",
    build: () => ({
      type: "doc",
      content: [
        h(2, "Falas de mudança (DARN-CAT)"),
        h(3, "Desejo"),
        p(),
        h(3, "Habilidade (Ability)"),
        p(),
        h(3, "Razões"),
        p(),
        h(3, "Necessidade"),
        p(),
        hr(),
        h(3, "Compromisso · Ativação · Tomada de ação"),
        p(),
      ],
    }),
  },
  {
    key: "girp",
    label: "GIRP",
    description: "Goal · Intervention · Response · Plan",
    build: () => ({
      type: "doc",
      content: [
        h(2, `GIRP — ${new Date().toLocaleDateString("pt-BR")}`),
        h(3, "G — Objetivo da sessão"),
        p(),
        h(3, "I — Intervenção"),
        p(),
        h(3, "R — Resposta da paciente"),
        p(),
        h(3, "P — Plano para próxima sessão"),
        p(),
      ],
    }),
  },
  {
    key: "anamnese",
    label: "Anamnese inicial",
    description: "Primeira entrevista completa",
    build: () => ({
      type: "doc",
      content: [
        h(2, "Anamnese — Primeira sessão"),
        h(3, "Identificação"),
        p("Nome, idade, estado civil, escolaridade, profissão."),
        h(3, "Queixa principal"),
        p(),
        h(3, "História da queixa"),
        p("Início, evolução, fatores precipitantes e de manutenção."),
        h(3, "História pregressa"),
        p("Tratamentos anteriores, internações, medicação."),
        h(3, "História familiar"),
        p("Estrutura familiar, saúde mental, dinâmica."),
        h(3, "História do desenvolvimento"),
        p("Gestação, infância, escolarização, marcos."),
        h(3, "Hábitos e rotina"),
        p("Sono, alimentação, atividade física, substâncias, lazer."),
        h(3, "Exame psíquico"),
        p("Aparência, atitude, consciência, orientação, atenção, memória, pensamento, humor, afeto, juízo crítico."),
        h(3, "Hipóteses diagnósticas"),
        p(),
        h(3, "Plano terapêutico inicial"),
        p(),
      ],
    }),
  },
  {
    key: "alta",
    label: "Alta",
    description: "Encerramento do processo",
    build: () => ({
      type: "doc",
      content: [
        h(2, `Alta terapêutica — ${new Date().toLocaleDateString("pt-BR")}`),
        h(3, "Motivo da alta"),
        p(),
        h(3, "Objetivos alcançados"),
        p(),
        h(3, "Evolução geral"),
        p(),
        h(3, "Recomendações"),
        p(),
        h(3, "Possibilidade de retorno"),
        p(),
      ],
    }),
  },
];
