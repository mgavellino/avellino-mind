// Structured anamnesis templates per specialty (tiptap JSON docs).
// The user picks one when creating a new prontuário; it is inserted as the
// initial content of the editor.

type Doc = { type: "doc"; content: any[] };

function heading(level: 1 | 2 | 3, text: string) {
  return { type: "heading", attrs: { level }, content: [{ type: "text", text }] };
}
function para(text = "") {
  return text ? { type: "paragraph", content: [{ type: "text", text }] } : { type: "paragraph" };
}
function bullets(items: string[]) {
  return {
    type: "bulletList",
    content: items.map((t) => ({
      type: "listItem",
      content: [{ type: "paragraph", content: [{ type: "text", text: t }] }],
    })),
  };
}

function build(title: string, sections: Array<{ h: string; items?: string[]; intro?: string }>): Doc {
  const content: any[] = [heading(1, title)];
  for (const s of sections) {
    content.push(heading(2, s.h));
    if (s.intro) content.push(para(s.intro));
    if (s.items?.length) content.push(bullets(s.items));
    content.push(para(""));
  }
  return { type: "doc", content };
}

export type AnamnesisTemplate = {
  id: string;
  label: string;
  specialty: string;
  description: string;
  doc: Doc;
};

export const ANAMNESIS_TEMPLATES: AnamnesisTemplate[] = [
  {
    id: "blank",
    label: "Em branco",
    specialty: "—",
    description: "Comece do zero com uma página vazia.",
    doc: { type: "doc", content: [{ type: "paragraph" }] },
  },
  {
    id: "clinica-adulto",
    label: "Anamnese Clínica Adulto",
    specialty: "Psicologia Clínica",
    description: "Modelo completo para primeira consulta de adultos.",
    doc: build("Anamnese Clínica — Adulto", [
      { h: "Identificação", items: ["Nome completo", "Idade", "Estado civil", "Escolaridade", "Profissão", "Religião / espiritualidade"] },
      { h: "Queixa principal", intro: "Descreva, nas palavras do paciente, o motivo da busca." },
      { h: "História da queixa atual", items: ["Início e evolução", "Fatores desencadeantes", "Estratégias de enfrentamento tentadas"] },
      { h: "História pessoal pregressa", items: ["Desenvolvimento (gestação, infância)", "Saúde mental anterior", "Tratamentos prévios", "Medicações em uso"] },
      { h: "História familiar", items: ["Composição familiar", "Antecedentes psiquiátricos", "Dinâmica familiar"] },
      { h: "Hábitos e rotina", items: ["Sono", "Alimentação", "Atividade física", "Uso de substâncias", "Rede social"] },
      { h: "Exame psíquico", items: ["Aparência e postura", "Humor e afeto", "Pensamento", "Senso-percepção", "Cognição", "Insight"] },
      { h: "Hipótese diagnóstica" },
      { h: "Plano terapêutico", items: ["Objetivos", "Frequência", "Abordagem"] },
    ]),
  },
  {
    id: "clinica-infantil",
    label: "Anamnese Infantil",
    specialty: "Psicologia Infantil",
    description: "Modelo de coleta com pais/responsáveis e criança.",
    doc: build("Anamnese Infantil", [
      { h: "Identificação", items: ["Nome da criança", "Data de nascimento / idade", "Escola e série", "Responsáveis"] },
      { h: "Queixa dos responsáveis" },
      { h: "Gestação e parto", items: ["Planejamento", "Intercorrências", "Tipo de parto", "Apgar"] },
      { h: "Desenvolvimento", items: ["Marcos motores", "Linguagem", "Controle esfincteriano", "Sono e alimentação"] },
      { h: "Escolaridade", items: ["Adaptação", "Rendimento", "Relação com colegas", "Relação com professores"] },
      { h: "Comportamento", items: ["Sociabilidade", "Brincadeiras preferidas", "Regulação emocional", "Limites"] },
      { h: "História médica e familiar" },
      { h: "Observação direta da criança" },
      { h: "Hipóteses e encaminhamentos" },
    ]),
  },
  {
    id: "tcc",
    label: "Avaliação TCC",
    specialty: "Terapia Cognitivo-Comportamental",
    description: "Conceitualização cognitiva inicial.",
    doc: build("Conceitualização TCC", [
      { h: "Dados de identificação" },
      { h: "Problemas atuais", intro: "Liste os problemas em ordem de prioridade." },
      { h: "Eventos precipitantes" },
      { h: "Crenças centrais hipotéticas" },
      { h: "Crenças intermediárias / regras" },
      { h: "Estratégias compensatórias" },
      { h: "Situação-pensamento-emoção-comportamento", intro: "Exemplos recentes:" },
      { h: "Pontos fortes e recursos" },
      { h: "Metas SMART do tratamento" },
      { h: "Plano de intervenção" },
    ]),
  },
  {
    id: "casal",
    label: "Terapia de Casal",
    specialty: "Terapia de Casal e Família",
    description: "Roteiro inicial para atendimento de casais.",
    doc: build("Anamnese — Terapia de Casal", [
      { h: "Identificação do casal", items: ["Nomes e idades", "Tempo de relacionamento", "Filhos", "Histórico de outros relacionamentos"] },
      { h: "Motivo da busca" },
      { h: "História do relacionamento", items: ["Como se conheceram", "Momentos marcantes", "Crises anteriores e soluções"] },
      { h: "Comunicação e conflitos" },
      { h: "Intimidade e sexualidade" },
      { h: "Projetos e expectativas" },
      { h: "Recursos do casal" },
      { h: "Plano terapêutico" },
    ]),
  },
  {
    id: "neuropsico",
    label: "Triagem Neuropsicológica",
    specialty: "Neuropsicologia",
    description: "Roteiro inicial para avaliação neuropsicológica.",
    doc: build("Triagem Neuropsicológica", [
      { h: "Identificação" },
      { h: "Motivo da avaliação" },
      { h: "Queixas cognitivas", items: ["Atenção", "Memória", "Funções executivas", "Linguagem", "Habilidades visuoespaciais"] },
      { h: "História médica e neurológica" },
      { h: "Exames e laudos prévios" },
      { h: "Medicações" },
      { h: "Impacto funcional na vida diária" },
      { h: "Plano de avaliação proposto" },
    ]),
  },
];
