import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(20000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
});

const SYSTEM_PROMPT = `Você é o assistente da Aline Dias, psicóloga. Você ajuda em tudo — clínico, administrativo, redação de prontuários, anamnese, técnicas (TCC, ACT, esquemas, psicanálise), DSM-5/CID-11 — e EXECUTA AÇÕES no app.

Quando a Aline pedir algo acionável (cadastrar paciente, agendar, marcar pagamento, adicionar despesa, listar agenda), USE as ferramentas disponíveis em vez de só descrever. Confirme o que foi feito em uma linha curta e útil.

Regras:
- Português do Brasil, profissional mas próximo.
- Markdown leve quando ajudar.
- Datas relativas (amanhã, sexta) → converta para a data real usando o fuso BRT (America/Sao_Paulo). Hoje: ${new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full" })}. Hora atual BRT: ${new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" })}.
- Antes de criar paciente novo, verifique se já existe via list_patients.
- Para agendar, sempre passe ISO completo. Duração padrão: 50 min.
- Valores em reais → converta para centavos.
- Nunca invente dados de pacientes. Se faltar info, pergunte.
- Apoio profissional, não substitui julgamento clínico.`;

type ToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

const TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "list_patients",
      description: "Lista pacientes (opcionalmente filtra por nome). Use antes de criar para evitar duplicatas, ou para resolver patient_id por nome.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Trecho do nome (opcional)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_patient",
      description: "Cria uma nova paciente no consultório.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          birth_date: { type: "string", description: "YYYY-MM-DD" },
          notes: { type: "string" },
        },
        required: ["full_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_appointments",
      description: "Lista compromissos num intervalo. Use pra responder 'quem tem hoje', 'esta semana', etc.",
      parameters: {
        type: "object",
        properties: {
          from: { type: "string", description: "ISO datetime início" },
          to: { type: "string", description: "ISO datetime fim" },
        },
        required: ["from", "to"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_appointment",
      description: "Agenda um compromisso. Use patient_id (descobrir via list_patients) ou patient_name (busca automática). Duração padrão 50 min se ends_at não vier.",
      parameters: {
        type: "object",
        properties: {
          starts_at: { type: "string", description: "ISO datetime" },
          ends_at: { type: "string", description: "ISO datetime (opcional)" },
          patient_id: { type: "string" },
          patient_name: { type: "string" },
          title: { type: "string" },
          kind: { type: "string", enum: ["consulta", "reuniao", "supervisao", "pessoal", "outro"] },
          notes: { type: "string" },
        },
        required: ["starts_at"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_appointment_paid",
      description: "Marca a consulta como recebida (cria recebível concluído). Use appointment_id; se só souber paciente+data, primeiro liste compromissos pra achar o id.",
      parameters: {
        type: "object",
        properties: {
          appointment_id: { type: "string" },
          amount_cents: { type: "number" },
          payment_method: { type: "string", enum: ["pix", "dinheiro", "cartao_credito", "cartao_debito", "transferencia"] },
        },
        required: ["appointment_id", "payment_method"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_expense",
      description: "Registra uma despesa do consultório (aluguel, material, supervisão, etc.).",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string" },
          amount_cents: { type: "number" },
          category: { type: "string", description: "ex: aluguel, material, supervisao, marketing" },
          payment_method: { type: "string", enum: ["pix", "dinheiro", "cartao_credito", "cartao_debito", "transferencia"] },
          paid_at: { type: "string", description: "ISO date (default: agora)" },
        },
        required: ["description", "amount_cents"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "financial_summary",
      description: "Resumo financeiro do mês: receitas, despesas, lucro, a receber.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "string", description: "YYYY-MM (default: mês atual)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Cria um lembrete/nota rápida pra Aline no bloco da dashboard.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string" },
          priority: { type: "string", enum: ["low", "normal", "high"] },
          due_at: { type: "string", description: "ISO datetime (opcional)" },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_records",
      description: "Busca trechos nos prontuários (full-text) por palavra-chave/sintoma.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "today_briefing",
      description: "Resumo do dia: consultas, recebíveis pendentes, aniversariantes hoje, pacientes inativos.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "birthday_list",
      description: "Pacientes aniversariantes do mês atual.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "inactive_patients",
      description: "Pacientes ativos sem consulta há mais de 30 dias.",
      parameters: { type: "object", properties: {} },
    },
  },
];

type ToolResult = { ok: boolean; data?: unknown; error?: string; summary?: string };

async function runTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string,
): Promise<ToolResult> {
  try {
    switch (name) {
      case "list_patients": {
        const q = (args.query as string | undefined)?.trim();
        let qb = supabase.from("patients").select("id, full_name, phone, email").order("full_name").limit(20);
        if (q) qb = qb.ilike("full_name", `%${q}%`);
        const { data, error } = await qb;
        if (error) throw error;
        return { ok: true, data, summary: `${data?.length ?? 0} paciente(s)` };
      }
      case "create_patient": {
        const payload = {
          owner_id: userId,
          full_name: String(args.full_name),
          phone: (args.phone as string) ?? null,
          email: (args.email as string) ?? null,
          birth_date: (args.birth_date as string) ?? null,
          notes: (args.notes as string) ?? null,
          is_active: true,
        };
        const { data, error } = await supabase.from("patients").insert(payload).select().single();
        if (error) throw error;
        return { ok: true, data, summary: `criada: ${payload.full_name}` };
      }
      case "list_appointments": {
        const { data, error } = await supabase
          .from("appointments")
          .select("id, starts_at, ends_at, status, kind, title, patient_id, patients(full_name)")
          .gte("starts_at", String(args.from))
          .lt("starts_at", String(args.to))
          .order("starts_at");
        if (error) throw error;
        return { ok: true, data, summary: `${data?.length ?? 0} compromisso(s)` };
      }
      case "schedule_appointment": {
        let patientId = args.patient_id as string | undefined;
        if (!patientId && args.patient_name) {
          const { data: pats } = await supabase
            .from("patients")
            .select("id, full_name")
            .ilike("full_name", `%${String(args.patient_name)}%`)
            .limit(2);
          if (!pats || pats.length === 0) {
            return { ok: false, error: `Paciente "${args.patient_name}" não encontrada. Crie primeiro.` };
          }
          if (pats.length > 1) {
            return { ok: false, error: `Mais de uma paciente bate com "${args.patient_name}". Especifique melhor.` };
          }
          patientId = pats[0].id;
        }
        const starts = new Date(String(args.starts_at));
        const ends = args.ends_at
          ? new Date(String(args.ends_at))
          : new Date(starts.getTime() + 50 * 60 * 1000);
        const { data, error } = await supabase
          .from("appointments")
          .insert({
            owner_id: userId,
            patient_id: patientId ?? null,
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
            title: (args.title as string) ?? null,
            kind: (args.kind as string) ?? "consulta",
            notes: (args.notes as string) ?? null,
            status: "scheduled",
          })
          .select()
          .single();
        if (error) throw error;
        return {
          ok: true,
          data,
          summary: starts.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }),
        };
      }
      case "mark_appointment_paid": {
        const apptId = String(args.appointment_id);
        const method = String(args.payment_method);
        const amount = args.amount_cents as number | undefined;
        // Mark appointment completed (triggers receivable creation)
        await supabase.from("appointments").update({ status: "completed" }).eq("id", apptId);
        // Upsert receivable
        const { data: existing } = await supabase
          .from("appointment_receivables")
          .select("id")
          .eq("appointment_id", apptId)
          .maybeSingle();
        const patch: Record<string, unknown> = {
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: method,
        };
        if (amount && amount > 0) patch.amount_cents = amount;
        if (existing) {
          await supabase.from("appointment_receivables").update(patch).eq("id", existing.id);
        } else {
          const { data: appt } = await supabase
            .from("appointments")
            .select("patient_id, ends_at")
            .eq("id", apptId)
            .maybeSingle();
          await supabase.from("appointment_receivables").insert({
            owner_id: userId,
            appointment_id: apptId,
            patient_id: appt?.patient_id ?? null,
            amount_cents: amount ?? 0,
            due_at: appt?.ends_at ?? new Date().toISOString(),
            ...patch,
          });
        }
        return { ok: true, summary: `pago via ${method}` };
      }
      case "add_expense": {
        const { data, error } = await supabase
          .from("expenses")
          .insert({
            owner_id: userId,
            description: String(args.description),
            amount_cents: Number(args.amount_cents),
            category: (args.category as string) ?? null,
            payment_method: (args.payment_method as string) ?? null,
            paid_at: (args.paid_at as string) ?? new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        return {
          ok: true,
          data,
          summary: `R$ ${(Number(args.amount_cents) / 100).toFixed(2)} · ${args.description}`,
        };
      }
      case "financial_summary": {
        const m = (args.month as string) ?? new Date().toISOString().slice(0, 7);
        const [y, mo] = m.split("-").map(Number);
        const start = new Date(y, mo - 1, 1).toISOString();
        const end = new Date(y, mo, 1).toISOString();
        const [recs, pending, exps] = await Promise.all([
          supabase
            .from("appointment_receivables")
            .select("amount_cents")
            .eq("status", "paid")
            .gte("paid_at", start)
            .lt("paid_at", end),
          supabase
            .from("appointment_receivables")
            .select("amount_cents")
            .in("status", ["pending", "overdue"]),
          supabase
            .from("expenses")
            .select("amount_cents")
            .gte("paid_at", start)
            .lt("paid_at", end),
        ]);
        const sum = (rows: { amount_cents: number }[] | null) =>
          (rows ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
        const received = sum(recs.data as { amount_cents: number }[]);
        const toReceive = sum(pending.data as { amount_cents: number }[]);
        const expenses = sum(exps.data as { amount_cents: number }[]);
        const profit = received - expenses;
        return {
          ok: true,
          data: { received, toReceive, expenses, profit },
          summary: `lucro R$ ${(profit / 100).toFixed(2)}`,
        };
      }
      default:
        return { ok: false, error: `Ferramenta desconhecida: ${name}` };
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

type GatewayMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
};

export const chatWithAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const { supabase, userId } = context;
    const toolHistory: { name: string; ok: boolean; summary?: string }[] = [];
    const convo: GatewayMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...data.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let finalText = "";
    for (let iter = 0; iter < 6; iter++) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: convo,
          tools: TOOLS,
        }),
      });

      if (response.status === 429) throw new Error("Muitas requisições. Aguarde e tente novamente.");
      if (response.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos pra continuar.");
      if (!response.ok) {
        const text = await response.text();
        console.error("AI gateway error:", response.status, text);
        throw new Error("Falha ao consultar a IA.");
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: GatewayMessage; finish_reason?: string }>;
      };
      const msg = payload.choices?.[0]?.message;
      if (!msg) break;

      convo.push(msg);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments || "{}");
          } catch {
            parsedArgs = {};
          }
          const result = await runTool(tc.function.name, parsedArgs, supabase, userId);
          toolHistory.push({
            name: tc.function.name,
            ok: result.ok,
            summary: result.summary ?? result.error,
          });
          convo.push({
            role: "tool",
            tool_call_id: tc.id,
            name: tc.function.name,
            content: JSON.stringify(result).slice(0, 4000),
          });
        }
        continue;
      }

      finalText = msg.content ?? "";
      break;
    }

    return { content: finalText || "(sem resposta)", tools: toolHistory };
  });
