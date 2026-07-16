import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  Key,
  Download,
  Loader2,
  Code2,
  Database,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export const Route = createFileRoute("/painel-migracao")({
  ssr: false,
  component: PainelMigracao,
});

type Credentials = {
  project_url: string;
  anon_key: string;
  service_role_key: string;
};

type PanelPayload = {
  credentials: Credentials;
  secrets: Record<string, string>;
  edge_functions: string[];
  edge_functions_count: number;
};

type TableInfo = {
  table_name: string;
  row_count: number;
  column_count: number;
  encrypted_columns: number;
  has_user_id: boolean;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Carrega source das edge functions em build time
const edgeFunctionSources = import.meta.glob("/supabase/functions/*/index.ts", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function mask(value: string): string {
  if (!value) return "";
  if (value.length <= 20) return "•".repeat(value.length);
  return `${value.slice(0, 12)}•••••${value.slice(-8)}`;
}

function classifyTable(name: string): "Essencial" | "Histórico" | "Ignorar" {
  const n = name.toLowerCase();
  if (n.includes("log") || n.includes("audit") || n.includes("history") || n.includes("reminder")) return "Histórico";
  if (n.startsWith("_") || n.includes("temp") || n.includes("cache")) return "Ignorar";
  return "Essencial";
}

function SecretRow({ label, value }: { label: string; value: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copiado`);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="truncate font-mono text-xs">{show ? value : mask(value)}</div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setShow((s) => !s)}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="sm" onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function downloadFile(name: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function PainelMigracao() {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<PanelPayload | null>(null);
  const [tables, setTables] = useState<TableInfo[] | null>(null);

  const availableFunctions = useMemo(() => {
    return Object.keys(edgeFunctionSources).map((p) => {
      const match = p.match(/functions\/([^/]+)\/index\.ts$/);
      return { path: p, name: match?.[1] ?? p };
    });
  }, []);

  async function revealAll() {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/painel-migracao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
      });
      if (!res.ok) throw new Error(`Falha (${res.status})`);
      const data = (await res.json()) as PanelPayload;
      setPayload(data);

      // buscar tabelas via migrate-sql
      const sqlRes = await fetch(`${SUPABASE_URL}/functions/v1/migrate-sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({
          key: data.credentials.service_role_key,
          sql_query: `
            SELECT
              c.table_name,
              (SELECT COUNT(*) FROM information_schema.columns ic WHERE ic.table_schema='public' AND ic.table_name=c.table_name) AS column_count,
              (SELECT COUNT(*) FROM information_schema.columns ic WHERE ic.table_schema='public' AND ic.table_name=c.table_name AND (ic.column_name ILIKE '%encrypted%' OR ic.column_name ILIKE '%_enc')) AS encrypted_columns,
              EXISTS(SELECT 1 FROM information_schema.columns ic WHERE ic.table_schema='public' AND ic.table_name=c.table_name AND ic.column_name='user_id') AS has_user_id,
              COALESCE((SELECT n_live_tup FROM pg_stat_user_tables WHERE schemaname='public' AND relname=c.table_name), 0) AS row_count
            FROM information_schema.tables c
            WHERE c.table_schema='public' AND c.table_type='BASE TABLE'
            ORDER BY c.table_name
          `,
        }),
      });
      if (sqlRes.ok) {
        const rows = (await sqlRes.json()) as TableInfo[];
        setTables(rows);
      }

      toast.success("Dados revelados");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    if (!payload) return;
    const text = [
      "══════════ CREDENCIAIS ══════════",
      `PROJECT_URL=${payload.credentials.project_url}`,
      `ANON_KEY=${payload.credentials.anon_key}`,
      `SERVICE_ROLE_KEY=${payload.credentials.service_role_key}`,
      "",
      "══════════ SECRETS ══════════",
      ...Object.entries(payload.secrets).map(([k, v]) => `${k}=${v}`),
      "",
      "══════════ EDGE FUNCTIONS ══════════",
      ...payload.edge_functions,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Tudo copiado");
  }

  function downloadEdgeFunctions() {
    const parts = availableFunctions.map(
      ({ name, path }) => `// ═════════ ${name} ═════════\n${edgeFunctionSources[path]}`,
    );
    downloadFile("edge-functions.ts", parts.join("\n\n"));
    toast.success(`${availableFunctions.length} function(s) exportadas`);
  }

  function downloadSecrets() {
    if (!payload) return;
    const entries = Object.entries(payload.secrets)
      .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
      .join("\n");
    const content = `export const SECRETS = {\n${entries}\n} as const;\n\nexport type SecretKey = keyof typeof SECRETS;\n`;
    downloadFile("secrets.ts", content);
    toast.success("secrets.ts baixado");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Painel de Migração</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Copie os itens abaixo na ordem e cole na extensão LoveX Migrate.
            </p>
          </div>
          <div className="flex gap-2">
            {payload && (
              <Button variant="outline" onClick={copyAll}>
                <Copy className="mr-2 h-4 w-4" /> Copiar Tudo
              </Button>
            )}
            <Button onClick={revealAll} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              Revelar Tudo
            </Button>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Página temporária</AlertTitle>
          <AlertDescription>
            Esta página deve ser removida após concluir a migração. Ela expõe dados sensíveis.
          </AlertDescription>
        </Alert>

        {/* Passo 1 - Credenciais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-brand" />
              Passo 1 — Credenciais
            </CardTitle>
            <CardDescription>URL do projeto e chaves de acesso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {payload ? (
              <>
                <SecretRow label="Project URL" value={payload.credentials.project_url} />
                <SecretRow label="Anon Key" value={payload.credentials.anon_key} />
                <SecretRow label="Service Role Key" value={payload.credentials.service_role_key} />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(payload.credentials.project_url);
                      toast.success("Project URL copiado");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copiar Project URL
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      navigator.clipboard.writeText(payload.credentials.service_role_key);
                      toast.success("Service Role Key copiado");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copiar Service Role Key
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Clique em "Revelar Tudo" para carregar.</p>
            )}
          </CardContent>
        </Card>

        {/* Passo 2 - Edge Functions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-brand" />
              Passo 2 — Edge Functions
            </CardTitle>
            <CardDescription>Baixe o arquivo com o código de todas as functions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(payload?.edge_functions.length
                ? payload.edge_functions
                : availableFunctions.map((f) => f.name)
              ).map((name) => (
                <Badge key={name} variant="secondary">
                  {name}
                </Badge>
              ))}
            </div>
            <Button variant="outline" onClick={downloadEdgeFunctions}>
              <Download className="mr-2 h-4 w-4" /> Baixar edge-functions.ts
            </Button>
          </CardContent>
        </Card>

        {/* Passo 3 - Secrets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-brand" />
              Passo 3 — Secrets
            </CardTitle>
            <CardDescription>Variáveis de ambiente configuradas no backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {payload ? (
              <>
                <div className="space-y-2">
                  {Object.entries(payload.secrets).map(([k, v]) => (
                    <SecretRow key={k} label={k} value={v} />
                  ))}
                </div>
                <Button variant="outline" onClick={downloadSecrets}>
                  <Download className="mr-2 h-4 w-4" /> Baixar secrets.ts
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Clique em "Revelar Tudo" para carregar.</p>
            )}
          </CardContent>
        </Card>

        {/* Passo 4 - Conferência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-brand" />
              Passo 4 — Conferência
            </CardTitle>
            <CardDescription>Tabelas do schema public e classificação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tables ? (
              <>
                <div className="text-sm text-muted-foreground">Total: {tables.length} tabelas</div>
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Tabela</th>
                        <th className="px-3 py-2 text-right font-medium">Linhas</th>
                        <th className="px-3 py-2 text-right font-medium">Colunas</th>
                        <th className="px-3 py-2 text-right font-medium">Enc.</th>
                        <th className="px-3 py-2 text-left font-medium">Categoria</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.map((t) => {
                        const cat = classifyTable(t.table_name);
                        return (
                          <tr key={t.table_name} className="border-t border-border">
                            <td className="px-3 py-2 font-mono text-xs">{t.table_name}</td>
                            <td className="px-3 py-2 text-right">{t.row_count}</td>
                            <td className="px-3 py-2 text-right">{t.column_count}</td>
                            <td className="px-3 py-2 text-right">{t.encrypted_columns}</td>
                            <td className="px-3 py-2">
                              <Badge
                                variant={
                                  cat === "Essencial"
                                    ? "default"
                                    : cat === "Histórico"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {cat}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Clique em "Revelar Tudo" para carregar.</p>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sobre senhas de usuários</AlertTitle>
              <AlertDescription>
                As senhas permanecem como hash bcrypt. Se o JWT Secret mudar no projeto de destino,
                os usuários apenas precisarão fazer login novamente; as senhas continuarão válidas.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
