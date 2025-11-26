// Edge Function to clear cache for specific endpoints
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: {
  env: { get: (key: string) => string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  openKv: () => Promise<any>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const { email, endpoint } = await req.json().catch(() => ({}));
    
    if (!email) {
      return new Response(JSON.stringify({ error: "Missing 'email' parameter" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const kv = await Deno.openKv();
    const results: Record<string, boolean> = {};

    // Clear specified endpoint or all
    const endpointsToClean = endpoint ? [endpoint] : ["adf-competencies", "get-adf"];

    for (const ep of endpointsToClean) {
      const key = [ep, email];
      try {
        await kv.delete(key);
        results[ep] = true;
        console.log(`✅ Cleared cache for ${ep}:${email}`);
      } catch (e) {
        results[ep] = false;
        console.error(`❌ Failed to clear ${ep}:${email}`, e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        email,
        cleared: results,
        message: `Cache cleared for ${Object.keys(results).length} endpoint(s)`,
      }),
      { headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});


