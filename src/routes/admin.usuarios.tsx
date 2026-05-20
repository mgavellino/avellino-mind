import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsers,
});

type Profile = {
  id: string;
  full_name: string | null;
  crp: string | null;
  specialty: string | null;
  phone: string | null;
  is_blocked: boolean;
  created_at: string;
};

function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers((data as unknown as Profile[]) ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleBlock = async (u: Profile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_blocked: !u.is_blocked })
      .eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(u.is_blocked ? "Usuário desbloqueado" : "Usuário bloqueado");
    load();
  };

  const filtered = users.filter((u) =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-semibold tracking-tight">Usuários</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Psicólogos cadastrados na plataforma.
      </p>

      <div className="mt-6">
        <input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-surface/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">CRP</th>
              <th className="text-left px-4 py-3">Especialidade</th>
              <th className="text-left px-4 py-3">Telefone</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-border/40">
                <td className="px-4 py-3 font-medium">{u.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.crp ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.specialty ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  {u.is_blocked ? (
                    <span className="text-xs text-destructive">Bloqueado</span>
                  ) : (
                    <span className="text-xs text-[oklch(0.78_0.18_155)]">Ativo</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleBlock(u)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-surface transition-colors"
                  >
                    {u.is_blocked ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Desbloquear
                      </>
                    ) : (
                      <>
                        <Ban className="h-3 w-3" /> Bloquear
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
