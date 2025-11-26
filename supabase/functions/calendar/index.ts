// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { normalizeToArray } from "../_shared/dendreo-utils.ts";
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

function buildApiUrlByParticipant(participantId: string, include: string = "formation,lcps"): string {
  const baseUrl = "https://pro.dendreo.com/competences_et_metiers/api/creneaux.php";
  const apiKey = Deno.env.get("DENDREO_API_KEY") || "";
  const url = new URL(baseUrl);
  url.searchParams.set("id_participant", participantId);
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
    const qpAdfIds = url.searchParams.get("adfIds"); // comma-separated

    let body: any = {};
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      body = await req.json().catch(() => ({}));
    }

    // Get participant ID
    const participantId = body?.participantId || body?.id_participant || qpParticipantId;
    if (!participantId) {
      return errorResponse(400, "Missing 'participantId' parameter");
    }

    console.log(`Fetching ALL sessions for participant ${participantId}`);

    // Fetch all sessions for this participant (single API call!)
    const apiUrl = buildApiUrlByParticipant(String(participantId));
    const response = await fetch(apiUrl, { method: "GET" });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(`Participant ${participantId} request failed: ${response.status} ${response.statusText}`);
      return errorResponse(response.status, `Upstream error: ${text || response.statusText}`);
    }

    const data = await response.json();
    
    // Parse response - handles both arrays and single objects robustly
    const allSessions = normalizeToArray(data, {
      idProperty: 'id_creneau',
      wrapperProperties: ['data', 'creneaux']
    });
    
    console.log(`API returned ${Array.isArray(data) ? 'array' : 'object'} format, normalized to ${allSessions.length} session(s)`);

    // Log statistics - show all ADFs, not filtered
    const sessionsByAdf = allSessions.reduce((acc: any, session: any) => {
      const adfId = session.id_action_de_formation || 'unknown';
      acc[adfId] = (acc[adfId] || 0) + 1;
      return acc;
    }, {});

    console.log(`Total sessions returned: ${allSessions.length}`);
    console.log(`Sessions by ADF:`, sessionsByAdf);

    // Return ALL sessions for the participant (no ADF filtering)
    return new Response(JSON.stringify(allSessions), { headers: corsHeaders });
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
    --data '{"participantId": 27, "adfIds": ["124", "126"]}'

*/
