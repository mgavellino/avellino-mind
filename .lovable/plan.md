# Fase 5 — Admin, Stripe, Permissões e Refino

## 1. Pagamentos (Stripe nativo Lovable)
- Rodar `recommend_payment_provider` → `enable_stripe_payments` (sem chave, ambiente test).
- Remover toda referência a Mercado Pago do código (`payments.gateway` default vira `stripe`, textos no Pricing/Features).
- Migration: trocar default da coluna `payments.gateway` para `'stripe'`.
- Produtos Stripe (Mensal, Trimestral, Anual, Vitalício) ficam para o passo seguinte assim que o Stripe estiver ativo (você confirma os valores no painel admin antes).

## 2. Admin Master — rota `/admin` separada
Layout próprio, fora do `/app`, protegido por `_admin.tsx` (checa `has_role(uid, 'admin_master')`).

Telas:
- `/admin` — overview (nº de psicólogos, MRR, trials ativos, churn simples).
- `/admin/precos` — CRUD da tabela `plans` (preço, label promo, parcelas, features).
- `/admin/promo` — edita banner de lançamento (texto, preço promo, validade, ativo/inativo).
- `/admin/usuarios` — lista profissionais, ver/bloquear/desbloquear, mudar role/plano.
- `/admin/configuracoes` — textos da landing editáveis (hero, CTA).

Tudo lê/escreve a tabela `plans` e uma nova `site_settings` (chave/valor JSON).

## 3. Permissões por plano
Nova função SQL `get_user_plan_limits(uid)` retornando JSON com:
- `max_patients` (Mensal: 100, Trimestral+: ilimitado)
- `can_export` (Trimestral+)
- `can_multi_prof` (Anual + Vitalício)
- `can_admin_panel_clinic` (Anual + Vitalício)
- `trial_days_left`

Hook `usePlan()` no client lê isso e bloqueia botões/rotas com mensagem "Faça upgrade".

Tabela `plans` ganha colunas `max_patients int`, `capabilities jsonb`.

## 4. Agenda — tipos + cores de status
Migration:
- Novo enum `appointment_kind`: `consulta | reuniao | supervisao | pessoal | outro`.
- Coluna `appointments.kind appointment_kind not null default 'consulta'`.
- Coluna `appointments.custom_kind text` (para "Outro").
- Enum `appointment_status` já tem `scheduled`; adiciono `completed | no_show | cancelled` se faltar.

UI:
- `AppointmentFormSheet`: select de tipo + campo livre se "Outro".
- Card no calendário: cor pela combinação tipo+status:
  - `scheduled` → azul (atual)
  - `completed` → verde
  - `no_show` → âmbar
  - `cancelled` → vermelho/cinza riscado
- Compromissos não-consulta dispensam `patient_id` (torno opcional) e mostram o título do evento.
- Legenda de cores no topo da agenda.

## 5. Landing — limpeza e veracidade
- Remover componente `SpotifyPlayer` e o card "Spotify integrado" das Features.
- Remover qualquer linha sobre "Pagamentos integrados" no Pricing (não existe ainda do lado psicólogo).
- Substituir imagem abaixo do hero por **mockup real renderizado em React** (componente `<DashboardPreview/>` em PT-BR: sidebar AvellPsy + agenda da semana + cards de métricas) usando os mesmos tokens do app. Sem screenshot estático, é HTML/CSS responsivo.
- Banner de promo no Pricing passa a ler de `site_settings.launch_promo` (texto + ativo).
- Features ficam só com o que existe de verdade: Agenda, Prontuário+autosave, Pacientes, Importação CSV, Exportação PDF/DOCX, Foto/avatar, Segurança LGPD.

## 6. Remoção do Spotify
- Apagar `SpotifyPlayer.tsx`, remover do `AppShell`, remover dependência mental.

## Detalhes técnicos

### Migrations (uma só)
```sql
-- enum tipo de compromisso
create type appointment_kind as enum ('consulta','reuniao','supervisao','pessoal','outro');
alter table appointments add column kind appointment_kind not null default 'consulta';
alter table appointments add column custom_kind text;
alter table appointments alter column patient_id drop not null;

-- status extras (se faltarem)
alter type appointment_status add value if not exists 'completed';
alter type appointment_status add value if not exists 'no_show';
alter type appointment_status add value if not exists 'cancelled';

-- plans
alter table plans add column if not exists max_patients int;
alter table plans add column if not exists capabilities jsonb not null default '{}'::jsonb;

-- payments gateway default
alter table payments alter column gateway set default 'stripe';

-- site_settings
create table site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table site_settings enable row level security;
create policy "Anyone reads site_settings" on site_settings for select using (true);
create policy "Admins write site_settings" on site_settings for all
  using (has_role(auth.uid(),'admin_master'))
  with check (has_role(auth.uid(),'admin_master'));

-- função de limites
create or replace function get_user_plan_limits(_uid uuid)
returns jsonb language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_build_object(
    'max_patients', p.max_patients,
    'capabilities', p.capabilities,
    'status', s.status,
    'expires_at', s.expires_at
  ), '{}'::jsonb)
  from subscriptions s
  left join plans p on p.id = s.plan_id
  where s.user_id = _uid
  order by s.created_at desc
  limit 1
$$;
```

### Stripe
Após `enable_stripe_payments` rodar, recebo a knowledge dos próximos passos (produtos + checkout). Crio os 4 produtos no passo seguinte; nesta fase só ativo a integração e plumbing.

## Fora de escopo (próximas fases)
- Criar produtos Stripe e fluxo de checkout/webhook real (próxima).
- Painel admin: aba "Cupons" e "Auditoria" (depois).
- Métricas avançadas no /admin (depois do checkout funcionar).

## Pergunta extra
Pensei em algo que talvez você queira nessa rodada e quero confirmar: **modo escuro/claro toggleável pelo psicólogo no app**? Hoje está fixo em dark. Se sim, adiciono no `/app/configuracoes` — me avisa que incluo.
