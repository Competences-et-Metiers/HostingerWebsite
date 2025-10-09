// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// Local ambient declaration to satisfy TypeScript/linters in non-Deno tooling
declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function buildApiUrl(adfId: string, include: string = "lcps"): string {
  const baseUrl = "https://pro.dendreo.com/competences_et_metiers/api/creneaux.php";
  const apiKey = Deno.env.get("DENDREO_API_KEY") || "";
  const url = new URL(baseUrl);
  url.searchParams.set("id_action_de_formation", adfId);
  url.searchParams.set("include", include);
  url.searchParams.set("key", apiKey);
  return url.toString();
}

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: corsHeaders,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const qpAdfId = url.searchParams.get("adfId") || url.searchParams.get("id_action_de_formation");
    const qpAdfIds = url.searchParams.get("adfIds"); // comma-separated

    let body: any = {};
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      body = await req.json().catch(() => ({}));
    }

    // Normalize to array of strings
    let adfIds: string[] = [];
    if (Array.isArray(body?.adfIds)) {
      adfIds = body.adfIds.map((v: any) => String(v));
    } else if (typeof qpAdfIds === "string" && qpAdfIds.trim()) {
      adfIds = qpAdfIds.split(",").map((v) => v.trim()).filter(Boolean);
    } else if (body?.adfId || body?.id_action_de_formation || qpAdfId) {
      const single = String(body?.adfId || body?.id_action_de_formation || qpAdfId);
      adfIds = [single];
    }

    if (!adfIds.length) {
      return errorResponse(400, "Missing 'adfId' or 'adfIds' parameter");
    }

    const requests = adfIds.map((id) => fetch(buildApiUrl(id), { method: "GET" }));
    const results = await Promise.all(requests);

    // If any request failed, surface first error
    const failed = results.find((r) => !r.ok);
    if (failed) {
      const text = await failed.text().catch(() => "");
      return errorResponse(failed.status, `Upstream error: ${text || failed.statusText}`);
    }

    const payloads = await Promise.all(results.map((r) => r.json()));
    // Each payload is expected to be an array; flatten conservatively
    const merged: unknown[] = [];
    for (const p of payloads) {
      if (Array.isArray(p)) {
        merged.push(...p);
      } else if (Array.isArray((p as any)?.data)) {
        merged.push(...(p as any).data);
      }
    }

    return new Response(JSON.stringify(merged), { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(500, message);
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/calendar' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"adfId":124}'

*/
