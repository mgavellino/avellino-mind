// Edge function: painel-migracao
// Retorna credenciais, secrets filtrados e lista de edge functions descobertas.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const EXCLUDED_KEYS = new Set([
  "PATH",
  "HOME",
  "HOSTNAME",
  "PORT",
  "USER",
  "LANG",
  "TERM",
  "TMPDIR",
  "DENO_DIR",
  "DENO_REGION",
  "DENO_DEPLOYMENT_ID",
  "_",
]);

const knownFunctionNames = [
  "migrate-sql",
  "painel-migracao",
  "ai",
  "ai-soap",
  "send-email",
  "send-reminder",
  "stripe-webhook",
  "create-checkout",
  "customer-portal",
  "check-subscription",
  "process-reminders",
  "send-invite",
  "notify-security-event",
  "generate-report",
  "birthday-reminders",
];

async function discoverEdgeFunctions(supabaseUrl: string): Promise<string[]> {
  const base = supabaseUrl.replace(/\/$/, "") + "/functions/v1";
  const results = await Promise.allSettled(
    knownFunctionNames.map(async (name) => {
      try {
        const res = await fetch(`${base}/${name}`, {
          method: "OPTIONS",
          headers: { "Access-Control-Request-Method": "POST" },
        });
        return res.status < 500 ? name : null;
      } catch {
        return null;
      }
    }),
  );
  return results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((v): v is string => !!v);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const allEnv = Deno.env.toObject();
  const secrets: Record<string, string> = {};
  for (const [k, v] of Object.entries(allEnv)) {
    if (EXCLUDED_KEYS.has(k)) continue;
    if (k.startsWith("XDG_")) continue;
    secrets[k] = v;
  }

  const edgeFunctions = await discoverEdgeFunctions(supabaseUrl);

  const payload = {
    credentials: {
      project_url: supabaseUrl,
      anon_key: anonKey,
      service_role_key: serviceRoleKey,
    },
    secrets,
    edge_functions: edgeFunctions,
    edge_functions_count: edgeFunctions.length,
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
