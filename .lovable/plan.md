
## O que vou fazer

### 1. Acesso da Aline (convite por email)
- Configuro domínio de email da Lovable (precisa do DNS — vou abrir o diálogo de setup; você precisa do acesso ao registrador do domínio da Aline; sugestão: `notify.alinedias.com.br`).
- Após domínio ativo, gero invite via Supabase Admin pra `cuidarcomaline@gmail.com` com template branded.
- Se não tiver domínio próprio da Aline ainda: mando pelo remetente padrão da Lovable como fallback (chega, só sem branding).

### 2. Onboarding guiado (4 passos)
- Rota `/app/onboarding` que abre automaticamente no 1º login se `profiles.onboarding_completed = false`.
- Steps: **Perfil** (nome, CRP, telefone, foto) → **Preço padrão da sessão** (`profiles.default_session_price_cents`) → **Cadastrar 1ª paciente** → **Tour rápido** (highlights nas seções).
- Skip permitido em qualquer step; marca `onboarding_completed=true` no fim.

### 3. Bloco de notas/lembretes na dashboard
- Nova tabela `quick_notes` (texto, prioridade `low|normal|high`, due_at, done).
- Card na dashboard com adicionar, marcar como feito, deletar, ordenar por prioridade + data.
- IA pode criar/editar notas via tool nova.

### 4. IA muito mais funcional
Adiciono estas tools no `ai.functions.ts`:
- `search_records` — busca full-text em prontuários da Aline.
- `generate_session_note` — recebe bullets, devolve evolução SOAP estruturada (sugestão, ela revisa e salva).
- `suggest_hypotheses` — recebe queixa/sintomas, sugere hipóteses diagnósticas (CID-11/DSM-5) + abordagens (TCC/ACT/psicanálise) com referências.
- `schedule_recurring` — agenda recorrência semanal/quinzenal por N semanas.
- `today_briefing` — resumo do dia: agenda, recebíveis pendentes, aniversariantes, pacientes inativos.
- `create_note` / `complete_note` — gerencia o bloco de notas.
- `monthly_report` — gera dados do relatório (front renderiza PDF).
- `birthday_list` — pacientes aniversariantes do mês.
- `inactive_patients` — sem consulta há >30 dias.

Modelo: `google/gemini-2.5-pro` (raciocínio clínico) com fallback `google/gemini-2.5-flash`.

### 5. Aniversariantes + inativos + relatório PDF
- Cards na dashboard: aniversariantes do mês, pacientes sem consulta há +30 dias (clicáveis pra agendar).
- Botão "Relatório do mês" no Financeiro → gera PDF (jspdf) com: receita por método, despesas por categoria, lucro, top pacientes, comparativo mês anterior.

### 6. Vercel-ready
- **Realidade**: Lovable publica em `*.lovable.app` direto. Pra Vercel você exporta o repo no GitHub e deploya lá.
- O que faço no código: adiciono `vercel.json` + script de build compatível + ajusto `vite.config.ts` pra detectar `VERCEL=1` e usar adapter Node em vez de Cloudflare Workers. Mantenho ambos funcionando (Lovable preview e Vercel prod).
- Documento o passo a passo em `DEPLOY_VERCEL.md`.
- Aviso de risco: server functions com `requireSupabaseAuth` precisam re-testar em Vercel; vou validar.

## Detalhes técnicos

**Migration nova:**
```sql
-- quick_notes
CREATE TABLE public.quick_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  due_at timestamptz,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- + GRANTs + RLS owner-only

-- profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS crp text,
  ADD COLUMN IF NOT EXISTS phone text;
```

**Arquivos novos/alterados:**
- `supabase/migrations/...quick_notes.sql`
- `src/routes/_authenticated/app.onboarding.tsx` (wizard)
- `src/components/app/QuickNotes.tsx`
- `src/components/app/BirthdaysCard.tsx`
- `src/components/app/InactivePatientsCard.tsx`
- `src/lib/notes.functions.ts`, `src/lib/reports.functions.ts`
- `src/lib/pdf-report.ts` (jspdf)
- `src/lib/ai.functions.ts` (+ 9 tools)
- `src/routes/_authenticated/app.index.tsx` (3 novos cards)
- `vercel.json`, `DEPLOY_VERCEL.md`, ajuste `vite.config.ts`
- `bun add jspdf jspdf-autotable`

## Ordem de execução
1. Migration (notas + colunas em profiles)
2. Onboarding wizard
3. QuickNotes
4. Birthdays + Inactive cards
5. PDF report
6. IA com 9 tools novas
7. Domínio de email + envio do invite
8. Config Vercel + doc

Aprova?
