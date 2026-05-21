import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";

const schema = z.object({ password: z.string().min(8, "Mínimo 8 caracteres") });
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
  head: () => ({
    meta: [
      { title: "Redefinir senha — AvellPsy" },
      { name: "description", content: "Defina uma nova senha para sua conta AvellPsy." },
      { property: "og:title", content: "Redefinir senha — AvellPsy" },
      { property: "og:description", content: "Defina uma nova senha para sua conta AvellPsy." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ResetPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Atualizar senha"}
        </button>
      </form>
    </AuthLayout>
  );
}
