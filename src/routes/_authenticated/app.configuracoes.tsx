import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AvatarUpload } from "@/components/app/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/configuracoes")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", email: "" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name })
      .eq("id", user.id);

    if (error) toast.error("Erro ao atualizar perfil");
    else toast.success("Perfil atualizado com sucesso");
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <AvatarUpload />
            <div className="space-y-1">
              <h3 className="font-medium">Foto de perfil</h3>
              <p className="text-sm text-muted-foreground">
                Atualize sua foto para ser exibida no sistema.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
