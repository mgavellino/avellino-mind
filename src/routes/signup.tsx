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
  fullName: z.string().min(2, "Informe seu nome"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Criar conta grátis — AvellPsy" },
      { name: "description", content: "Comece grátis no AvellPsy: agenda, prontuário e financeiro para psicólogos em minutos." },
      { property: "og:title", content: "Criar conta grátis — AvellPsy" },
      { property: "og:description", content: "Comece grátis no AvellPsy: agenda, prontuário e financeiro para psicólogos em minutos." },
      { property: "og:url", content: "/signup" },
    ],
    links: [{ rel: "canonical", href: "/signup" }],
  }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Verifique seu email para confirmar.");
    navigate({ to: "/login" });
  };

  return (
    <AuthLayout title="Criar conta" subtitle="14 dias grátis. Sem cartão.">
      <GoogleButton label="Cadastrar com Google" />
      <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
        <div className="h-px bg-border flex-1" />
        ou
        <div className="h-px bg-border flex-1" />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Nome completo</label>
          <input
            {...register("fullName")}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>}
        </div>
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
          <label className="text-xs text-muted-foreground">Senha</label>
          <input
            type="password"
            autoComplete="new-password"
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
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Já tem conta?{" "}
        <Link to="/login" className="text-foreground hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
