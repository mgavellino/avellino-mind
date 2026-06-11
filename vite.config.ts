// @lovable.dev/vite-tanstack-config já inclui plugins padrão.
// Para deploy em Vercel, ativamos Nitro com preset "vercel" (Build Output API).
// No sandbox do Lovable / preview o nitro roda com preset cloudflare-module (default interno).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = !!process.env.VERCEL;

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  ...(isVercel
    ? {
        nitro: {
          preset: "vercel",
        },
      }
    : {}),
});
