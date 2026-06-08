# Deploy na Vercel

Este projeto roda em **TanStack Start** com SSR. Por padrão a Lovable hospeda em `*.lovable.app`. Pra deploy na Vercel:

## Passo a passo

1. **Exporte o repositório** pra GitHub (botão GitHub no topo do editor Lovable).
2. **Conecte na Vercel**: https://vercel.com/new — importa o repo.
3. **Configure as variáveis de ambiente** no dashboard da Vercel (Settings → Environment Variables):

### Variáveis públicas (Vite — também `VITE_PUBLIC_*` se quiser)
```
VITE_SUPABASE_URL=https://ahvlinsuctynyawtroog.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<copie do .env>
VITE_SUPABASE_PROJECT_ID=ahvlinsuctynyawtroog
```

### Variáveis server-only (NUNCA com prefixo VITE_)
```
SUPABASE_URL=https://ahvlinsuctynyawtroog.supabase.co
SUPABASE_PUBLISHABLE_KEY=<copie do .env>
SUPABASE_SERVICE_ROLE_KEY=<copie do .env>
LOVABLE_API_KEY=<copie do .env>
```

4. **Antes do 1º deploy**, ajuste o `vite.config.ts` pra usar o preset Node em vez do Cloudflare:

```ts
// vite.config.ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server", preset: "vercel" }, // <- adicione preset
  },
});
```

5. **Conecte o domínio** da Aline no dashboard Vercel (Settings → Domains).

6. **Atualize `Redirect URLs` no Supabase Auth** (Lovable → Cloud → Users → Auth Settings):
   - Adicione `https://seu-dominio-vercel.vercel.app/**`
   - Adicione `https://dominio-aline.com.br/**`

## Avisos importantes

- O preview do Lovable continua funcionando normalmente em Cloudflare Workers.
- Pra Vercel, o preset Node tem comportamento ligeiramente diferente — teste o login, o magic link e as server functions assim que subir.
- Em caso de erro 500 em server function: confira que `attachSupabaseAuth` está em `src/start.ts` e que as env vars `SUPABASE_*` estão setadas no Vercel.
- Edge functions do Supabase (se algum dia adicionar) continuam rodando no Supabase — não vão pra Vercel.

## Custo
Vercel Hobby (grátis) cobre essa aplicação tranquilo. Se passar de limites, o plano Pro é $20/mês.
