import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { AvatarUpload } from "@/components/app/AvatarUpload";

export type Patient = {
  id: string;
  owner_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  address: string | null;
  notes: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  ownerId: string | undefined;
  onSaved: (patient: Patient, isNew: boolean) => void;
};

const empty = {
  full_name: "",
  email: "",
  phone: "",
  cpf: "",
  birth_date: "",
  address: "",
  notes: "",
  avatar_url: "" as string | null | "",
  is_active: true,
};

export function PatientFormSheet({ open, onOpenChange, patient, ownerId, onSaved }: Props) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient) {
      setForm({
        full_name: patient.full_name ?? "",
        email: patient.email ?? "",
        phone: patient.phone ?? "",
        cpf: patient.cpf ?? "",
        birth_date: patient.birth_date ?? "",
        address: patient.address ?? "",
        notes: patient.notes ?? "",
        avatar_url: patient.avatar_url ?? "",
        is_active: patient.is_active,
      });
    } else {
      setForm(empty);
    }
  }, [patient, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Informe o nome completo");
      return;
    }
    if (!ownerId) return;

    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      cpf: form.cpf.trim() || null,
      birth_date: form.birth_date || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
      avatar_url: form.avatar_url || null,
      is_active: form.is_active,
    };

    if (patient) {
      const { data, error } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", patient.id)
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Paciente atualizado");
      onSaved(data as Patient, false);
    } else {
      const { data, error } = await supabase
        .from("patients")
        .insert({ ...payload, owner_id: ownerId })
        .select()
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Paciente cadastrado");
      onSaved(data as Patient, true);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-background border-l border-border/60">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {patient ? "Editar paciente" : "Novo paciente"}
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Informações pessoais e clínicas — armazenadas com criptografia.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {ownerId && (
            <div>
              <label className="text-xs text-muted-foreground">Foto</label>
              <div className="mt-2">
                <AvatarUpload
                  value={form.avatar_url || null}
                  onChange={(url) => setForm({ ...form, avatar_url: url ?? "" })}
                  ownerId={ownerId}
                  pathPrefix={`patients/${patient?.id ?? "new"}`}
                  fallback={form.full_name || "?"}
                  size={72}
                />
              </div>
            </div>
          )}
          <Field label="Nome completo *">
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className={inputCls}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Telefone">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="CPF">
              <input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Data de nascimento">
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Endereço">
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Observações">
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={`${inputCls} resize-none py-2`}
            />
          </Field>

          <label className="flex items-center gap-2.5 text-sm text-muted-foreground select-none cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-border/80 bg-background accent-foreground"
            />
            Paciente ativo
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? "Salvando..." : patient ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-surface border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
