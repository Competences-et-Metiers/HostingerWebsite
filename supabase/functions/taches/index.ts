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
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json",
};

function buildApiUrl(participantId: string): string {
  const baseUrl = "https://pro.dendreo.com/competences_et_metiers/api/taches.php";
  const apiKey = Deno.env.get("DENDREO_API_KEY") || "";
  const url = new URL(baseUrl);
  url.searchParams.set("id_participant", participantId);
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
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers": req.headers.get("access-control-request-headers") || corsHeaders["Access-Control-Allow-Headers"]
      },
      status: 200 
    });
  }

  try {
    const url = new URL(req.url);
    const qpParticipantId = url.searchParams.get("participantId") || url.searchParams.get("id_participant");

    let body: any = {};
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      body = await req.json().catch(() => ({}));
    }

    // Get participant ID
    const participantId = body?.participantId || body?.id_participant || qpParticipantId;
    if (!participantId) {
      return errorResponse(400, "Missing 'participantId' parameter");
    }

    console.log(`Fetching tasks for participant ${participantId}`);

    // Fetch tasks for this participant
    const apiUrl = buildApiUrl(String(participantId));
    const response = await fetch(apiUrl, { method: "GET" });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(`Participant ${participantId} request failed: ${response.status} ${response.statusText}`);
      return errorResponse(response.status, `Upstream error: ${text || response.statusText}`);
    }

    const data = await response.json();
    
    // Log statistics
    const esignatureCount = data?.counts?.esignature || 0;
    const taches = Array.isArray(data?.taches) ? data.taches : [];
    const esignatures = taches.filter((t: any) => t.type === 'esignature');
    
    console.log(`Tasks for participant ${participantId}: ${esignatureCount} e-signatures pending, ${taches.length} total tasks`);

    return new Response(JSON.stringify(data), { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(500, message);
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/taches' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"participantId": 27}'

*/

