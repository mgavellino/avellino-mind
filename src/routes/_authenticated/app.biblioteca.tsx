import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Pencil, BookOpen, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { waLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/app/biblioteca")({
  component: LibraryPage,
});

type Resource = {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  category: string | null;
};

const CATEGORIES = ["Ansiedade", "Depressão", "Sono", "Mindfulness", "Casal", "Infantil", "Trauma", "Outro"];

function LibraryPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Resource[]>([]);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", description: "", category: "Ansiedade" });

  const load = async () => {
    const { data } = await supabase
      .from("psychoeducation_resources")
      .select("*")
      .order("created_at", { ascending: false });
    setList((data ?? []) as unknown as Resource[]);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const startEdit = (r: Resource | null) => {
    setEditing(r);
    setForm({
      title: r?.title ?? "",
      url: r?.url ?? "",
      description: r?.description ?? "",
      category: r?.category ?? "Ansiedade",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.title.trim()) return toast.error("Título é obrigatório");
    const payload = {
      title: form.title.trim(),
      url: form.url || null,
      description: form.description || null,
      category: form.category,
    };
    if (editing) {
      await supabase.from("psychoeducation_resources").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("psychoeducation_resources").insert({ ...payload, owner_id: user.id });
    }
    toast.success("Salvo");
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover material?")) return;
    await supabase.from("psychoeducation_resources").delete().eq("id", id);
    load();
  };

  const shareText = (r: Resource) =>
    `${r.title}${r.description ? `\n\n${r.description}` : ""}${r.url ? `\n\n${r.url}` : ""}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Biblioteca</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Materiais de psicoeducação. Compartilhe com pacientes via WhatsApp em 1 clique.
          </p>
        </div>
        <button
          onClick={() => startEdit(null)}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Novo material
        </button>
      </div>

      {open && (
        <div className="rounded-2xl border border-border/60 bg-surface/40 p-4 mb-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Link (PDF, vídeo, artigo)</label>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border/60 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm resize-none"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
              className="h-10 px-4 rounded-lg text-sm text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              className="h-10 px-5 rounded-lg bg-brand text-primary-foreground text-sm font-medium"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Adicione PDFs, artigos e vídeos que você costuma compartilhar com pacientes.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border/60 bg-surface/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{r.title}</div>
                  {r.category && (
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                      {r.category}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(r)}
                    className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {r.description && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{r.description}</p>
              )}
              <div className="mt-3 flex items-center gap-1 flex-wrap">
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs border border-border/60 hover:bg-surface"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Abrir
                  </a>
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareText(r));
                    toast.success("Texto copiado");
                  }}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs border border-border/60 hover:bg-surface"
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </button>
                <a
                  href={waLink(null, shareText(r)) ?? `https://wa.me/?text=${encodeURIComponent(shareText(r))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
