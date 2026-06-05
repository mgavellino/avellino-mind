import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(20000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
});

const SYSTEM_PROMPT = `Você é o assistente IA do Aline Dias Psicóloga, uma plataforma de gestão para psicólogos brasileiros.

Você ajuda o psicólogo em tudo: redação de prontuários, resumos de sessões, sugestões de perguntas de anamnese, hipóteses diagnósticas (sempre lembrando que a decisão clínica é do profissional), orientação sobre técnicas (TCC, ACT, esquemas, psicanálise etc.), referências de DSM-5/CID-11, manejo de casos, comunicação com pacientes, dúvidas administrativas do app, marketing para psicólogos e qualquer outra dúvida.

Regras:
- Responda em português do Brasil, tom profissional mas próximo.
- Use markdown (listas, negrito, títulos curtos) quando ajudar a leitura.
- Seja conciso por padrão. Se o usuário pedir, aprofunde.
- Nunca invente fatos sobre pacientes específicos: se faltar contexto, peça.
- Lembre: o conteúdo é apoio, não substitui o julgamento clínico nem fornece diagnóstico para terceiros.`;

export const chatWithAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...data.messages,
        ],
      }),
    });

    if (response.status === 429) {
      throw new Error("Muitas requisições. Aguarde alguns segundos e tente novamente.");
    }
    if (response.status === 402) {
      throw new Error("Créditos de IA esgotados no workspace. Adicione créditos para continuar.");
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Falha ao consultar a IA. Tente novamente.");
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "";
    return { content };
  });
