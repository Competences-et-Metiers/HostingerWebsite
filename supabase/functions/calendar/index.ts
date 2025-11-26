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

    // Get ADF IDs to filter by (optional)
    let adfIds: string[] = [];
    if (Array.isArray(body?.adfIds)) {
      adfIds = body.adfIds.map((v: any) => String(v));
    } else if (typeof qpAdfIds === "string" && qpAdfIds.trim()) {
      adfIds = qpAdfIds.split(",").map((v) => v.trim()).filter(Boolean);
    }

    console.log(`Fetching sessions for participant ${participantId}${adfIds.length > 0 ? ` (filtering by ADFs: ${adfIds.join(", ")})` : ""}`);

    // Fetch all sessions for this participant (single API call!)
    const apiUrl = buildApiUrlByParticipant(String(participantId));
    const response = await fetch(apiUrl, { method: "GET" });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(`Participant ${participantId} request failed: ${response.status} ${response.statusText}`);
      return errorResponse(response.status, `Upstream error: ${text || response.statusText}`);
    }

    const data = await response.json();
    
    // Parse response - expecting an array
    let allSessions: any[] = [];
    if (Array.isArray(data)) {
      allSessions = data;
    } else if (Array.isArray(data?.data)) {
      allSessions = data.data;
    } else if (Array.isArray(data?.creneaux)) {
      allSessions = data.creneaux;
    } else {
      console.warn("Unexpected response format:", typeof data);
      return new Response(JSON.stringify([]), { headers: corsHeaders });
    }

    // Filter by ADF IDs if provided
    let filteredSessions = allSessions;
    if (adfIds.length > 0) {
      filteredSessions = allSessions.filter((session: any) => 
        adfIds.includes(String(session.id_action_de_formation))
      );
    }

    // Log statistics
    const sessionsByAdf = filteredSessions.reduce((acc: any, session: any) => {
      const adfId = session.id_action_de_formation || 'unknown';
      acc[adfId] = (acc[adfId] || 0) + 1;
      return acc;
    }, {});

    console.log(`Total sessions: ${allSessions.length}, Filtered: ${filteredSessions.length}`);
    console.log(`Sessions by ADF:`, sessionsByAdf);

    return new Response(JSON.stringify(filteredSessions), { headers: corsHeaders });
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
