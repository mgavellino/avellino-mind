import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleButton } from "@/components/auth/GoogleButton";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (s) => ({ redirect: (s.redirect as string) || "/app" }),
  head: () => ({
    meta: [
      { title: "Entrar — Aline Dias Psicóloga" },
      { name: "description", content: "Acesso restrito ao consultório da psicóloga Aline Dias." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(data);
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Credenciais inválidas" : error.message);
      return;
    }
    toast.success("Bem-vindo de volta");
    navigate({ to: search.redirect });
  };

  return (
    <AuthLayout title="Entrar" subtitle="Acesse o consultório">
      <GoogleButton />
      <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
        <div className="h-px bg-border flex-1" />
        ou
        <div className="h-px bg-border flex-1" />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Email</label>
          <input
            type="email"
            autoComplete="email"
            {...register("email")}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Senha</label>
            <Link to="/forgot-password" className="text-xs text-brand hover:underline">
              Esqueci a senha
            </Link>
          </div>
          <input
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Acesso restrito. Solicite suas credenciais à Aline.
      </p>
    </AuthLayout>
  );
}
