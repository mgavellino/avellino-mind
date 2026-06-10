import { useState } from "react";
import { Sparkles, X, Loader2, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { generateSoapDraft } from "@/lib/ai-soap.functions";

type Props = {
  open: boolean;
  onClose: () => void;
  patientName?: string;
  onInsert: (markdown: string) => void;
};

export function AiSoapDraftDialog({ open, onClose, patientName, onInsert }: Props) {
  const generate = useServerFn(generateSoapDraft);
  const [bullets, setBullets] = useState("");
  const [template, setTemplate] = useState<"soap" | "girp" | "darn">("soap");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");

  if (!open) return null;

  const run = async () => {
    if (!bullets.trim()) return toast.error("Escreva alguns bullets primeiro");
    setLoading(true);
    setDraft("");
    try {
      const res = await generate({ data: { bullets, template, patientContext: patientName } });
      setDraft(res.markdown);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl bg-background border border-border/60 rounded-t-2xl md:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-semibold">IA: rascunho de evolução</h3>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-md hover:bg-surface">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground mr-2">Formato:</span>
            {(["soap", "girp", "darn"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`h-8 px-3 rounded-full text-xs border ${template === t ? "bg-foreground text-background border-foreground" : "border-border/60 text-muted-foreground"}`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">
              Bullets / notas brutas da sessão (português, qualquer formato)
            </label>
            <textarea
              value={bullets}
              onChange={(e) => setBullets(e.target.value)}
              rows={6}
              placeholder={"- relatou ansiedade crescente esta semana\n- discussão com mãe na 4a\n- fez exercício de respiração 2x\n- humor médio, afeto congruente\n- combinamos diário de pensamentos automáticos"}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-surface border border-border/60 text-sm resize-none font-mono"
            />
          </div>

          <button
            onClick={run}
            disabled={loading || !bullets.trim()}
            className="w-full h-10 rounded-lg bg-brand text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar rascunho
          </button>

          {draft && (
            <div className="rounded-xl border border-border/60 bg-surface/40 p-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Rascunho (revise antes de inserir)
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{draft}</pre>
            </div>
          )}
        </div>

        {draft && (
          <div className="p-4 border-t border-border/60 flex justify-end gap-2">
            <button onClick={onClose} className="h-10 px-4 rounded-lg text-sm text-muted-foreground">
              Cancelar
            </button>
            <button
              onClick={() => {
                onInsert(draft);
                onClose();
              }}
              className="h-10 px-5 rounded-lg bg-foreground text-background text-sm font-medium inline-flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Inserir no prontuário
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
