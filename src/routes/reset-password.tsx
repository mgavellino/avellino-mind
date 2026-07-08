import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";

const schema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
  head: () => ({
    meta: [
      { title: "Redefinir senha — Aline Dias Psicóloga" },
      { name: "description", content: "Defina uma nova senha para sua conta Aline Dias Psicóloga." },
      { property: "og:title", content: "Redefinir senha — Aline Dias Psicóloga" },
      { property: "og:description", content: "Defina uma nova senha para sua conta Aline Dias Psicóloga." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ResetPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(true);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSessionReady(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setSessionReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada");
    navigate({ to: "/app" });
  };

  return (
    <AuthLayout title="Nova senha" subtitle="Defina sua nova senha de acesso">
      {!sessionReady && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Link expirado ou inválido. Solicite um novo link de redefinição.
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Nova senha</label>
          <input
            type="password"
            autoComplete="new-password"
            {...register("password")}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Confirmar senha</label>
          <input
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loading || !sessionReady}
          className="w-full h-10 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Atualizar senha"}
        </button>
      </form>
      {!sessionReady && (
        <p className="mt-5 text-center text-xs text-muted-foreground">
          <Link to="/forgot-password" className="text-foreground hover:underline">
            Enviar novo link
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
