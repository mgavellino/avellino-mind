import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Pencil, Trash2, Mail, Phone, Download, Upload, ExternalLink } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PatientFormSheet, type Patient } from "@/components/app/PatientFormSheet";
import { exportPatientsCSV, importPatientsCSV } from "@/lib/patient-csv";

export const Route = createFileRoute("/_authenticated/app/pacientes")({
  component: PatientsPage,
});

function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setPatients((data ?? []) as Patient[]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q),
    );
  }, [query, patients]);

  const handleDelete = async (p: Patient) => {
    if (!confirm(`Remover ${p.full_name}?`)) return;
    const { error } = await supabase.from("patients").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Paciente removido");
    setPatients((prev) => prev.filter((x) => x.id !== p.id));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pacientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patients.length} cadastrados · gerencie seu portfólio clínico.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f || !user) return;
              const t = toast.loading("Importando...");
              const res = await importPatientsCSV(f, user.id);
              toast.dismiss(t);
              if (res.inserted) toast.success(`${res.inserted} pacientes importados`);
              if (res.errors.length) toast.error(res.errors[0]);
              if (res.inserted) load();
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border/60 bg-surface hover:bg-surface-elevated text-xs transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Importar CSV
          </button>
          <button
            onClick={() => {
              if (!patients.length) return toast.error("Sem pacientes para exportar");
              exportPatientsCSV(patients);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border/60 bg-surface hover:bg-surface-elevated text-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background text-sm font-medium px-4 h-9 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Novo paciente
          </button>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, email ou telefone"
          className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface border border-border/60 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface/40 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-sm text-muted-foreground">
              {query ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado ainda."}
            </p>
            {!query && (
              <button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-2 text-sm text-[oklch(0.68_0.20_245)] hover:underline"
              >
                <Plus className="h-4 w-4" />
                Cadastrar primeiro paciente
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Contato</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">CPF</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Status</th>
                <th className="px-5 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/40 last:border-0 hover:bg-surface/60 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-brand grid place-items-center text-sm font-medium text-white overflow-hidden shrink-0">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          p.full_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to="/app/pacientes/$id"
                          params={{ id: p.id }}
                          className="text-sm font-medium truncate hover:text-brand"
                        >
                          {p.full_name}
                        </Link>
                        {p.birth_date && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(p.birth_date).toLocaleDateString("pt-BR")}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      {p.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          {p.email}
                        </div>
                      )}
                      {p.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" />
                          {p.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-muted-foreground">
                    {p.cpf || "—"}
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${
                        p.is_active
                          ? "bg-[oklch(0.68_0.20_245)]/10 text-[oklch(0.68_0.20_245)]"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {p.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setOpen(true);
                        }}
                        className="h-8 w-8 grid place-items-center rounded-md hover:bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="h-8 w-8 grid place-items-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PatientFormSheet
        open={open}
        onOpenChange={setOpen}
        patient={editing}
        ownerId={user?.id}
        onSaved={(p: Patient, isNew: boolean) => {
          if (isNew) setPatients((prev) => [p, ...prev]);
          else setPatients((prev) => prev.map((x) => (x.id === p.id ? p : x)));
          setOpen(false);
        }}
      />
    </div>
  );
}
