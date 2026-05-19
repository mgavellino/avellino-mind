import Papa from "papaparse";
import { saveAs } from "file-saver";
import { supabase } from "@/integrations/supabase/client";
import type { Patient } from "@/components/app/PatientFormSheet";

const FIELDS = [
  "full_name",
  "email",
  "phone",
  "cpf",
  "birth_date",
  "address",
  "notes",
  "is_active",
] as const;

export function exportPatientsCSV(patients: Patient[]) {
  const rows = patients.map((p) => ({
    full_name: p.full_name,
    email: p.email ?? "",
    phone: p.phone ?? "",
    cpf: p.cpf ?? "",
    birth_date: p.birth_date ?? "",
    address: p.address ?? "",
    notes: p.notes ?? "",
    is_active: p.is_active ? "true" : "false",
  }));
  const csv = Papa.unparse({ fields: [...FIELDS], data: rows });
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `pacientes-${new Date().toISOString().slice(0, 10)}.csv`);
}

export type ImportResult = { inserted: number; skipped: number; errors: string[] };

export async function importPatientsCSV(file: File, ownerId: string): Promise<ImportResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const errors: string[] = [];
        const payload: Record<string, unknown>[] = [];
        for (const [i, row] of result.data.entries()) {
          const name = (row.full_name || row.nome || row.name || "").trim();
          if (!name) {
            errors.push(`Linha ${i + 2}: nome vazio`);
            continue;
          }
          payload.push({
            owner_id: ownerId,
            full_name: name,
            email: (row.email || "").trim() || null,
            phone: (row.phone || row.telefone || "").trim() || null,
            cpf: (row.cpf || "").trim() || null,
            birth_date: (row.birth_date || row.nascimento || "").trim() || null,
            address: (row.address || row.endereco || "").trim() || null,
            notes: (row.notes || row.observacoes || "").trim() || null,
            is_active: row.is_active ? row.is_active !== "false" : true,
          });
        }
        if (payload.length === 0) {
          resolve({ inserted: 0, skipped: result.data.length, errors });
          return;
        }
        const { error, count } = await supabase
          .from("patients")
          .insert(payload, { count: "exact" });
        if (error) {
          errors.push(error.message);
          resolve({ inserted: 0, skipped: payload.length, errors });
          return;
        }
        resolve({
          inserted: count ?? payload.length,
          skipped: result.data.length - payload.length,
          errors,
        });
      },
      error: (err) => resolve({ inserted: 0, skipped: 0, errors: [err.message] }),
    });
  });
}
