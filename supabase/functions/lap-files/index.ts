// @ts-nocheck
// supabase/functions/lap-files/index.ts
// Fetch shared files for given LAP IDs from Dendreo:
// GET fichiers.php?cible=lap&id_cible=[LAP_ID]&collection_name=partage_lap&key=...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "https://yourapp.com"]; // adjust

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
  } as Record<string, string>;
}

async function readJsonSafe(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  if (isJson) return await res.json().catch(() => null);
  try {
    const txt = await res.text();
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const lapIdsParam = url.searchParams.get("lap_ids");

    if (!lapIdsParam) {
      return new Response(JSON.stringify({ error: "Missing 'lap_ids' query parameter" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("DENDREO_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server not configured: missing DENDREO_API_KEY" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const rawIds = lapIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const uniqueIds = Array.from(new Set(rawIds));
    if (uniqueIds.length === 0) {
      return new Response(JSON.stringify({ error: "No valid LAP IDs provided" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const buildUrl = (lapId: string) => {
      const u = new URL("https://pro.dendreo.com/competences_et_metiers/api/fichiers.php");
      u.searchParams.set("cible", "lap");
      u.searchParams.set("id_cible", lapId);
      u.searchParams.set("collection_name", "partage_lap");
      u.searchParams.set("key", apiKey);
      return u;
    };

    const controllerMap = new Map<string, AbortController>();
    const timeoutMap = new Map<string, number>();

    const tasks = uniqueIds.map(async (lapId) => {
      const controller = new AbortController();
      controllerMap.set(lapId, controller);
      const timeout = setTimeout(() => controller.abort(), 15_000) as unknown as number;
      timeoutMap.set(lapId, timeout);
      try {
        const res = await fetch(buildUrl(lapId).toString(), { method: "GET", signal: controller.signal });
        const body = await readJsonSafe(res);
        return { lap_id: lapId, ok: res.ok, status: res.status, body };
      } catch (err) {
        const msg = err instanceof Error && err.name === "AbortError" ? "Upstream request timed out" : (err as Error)?.message ?? "Unexpected error";
        return { lap_id: lapId, ok: false, status: 502, body: { error: msg } };
      } finally {
        const t = timeoutMap.get(lapId);
        if (t !== undefined) clearTimeout(t as unknown as number);
      }
    });

    const results = await Promise.all(tasks);

    const perLap: Record<string, unknown> = {};
    const allFiles: unknown[] = [];
    for (const r of results) {
      perLap[r.lap_id] = r.body;
      if (r.ok && r.body) {
        if (Array.isArray(r.body)) {
          for (const f of r.body) allFiles.push(f);
        } else if (typeof r.body === "object") {
          const files = (r.body as Record<string, unknown>)["fichiers"] as unknown;
          if (Array.isArray(files)) for (const f of files) allFiles.push(f);
        }
      }
    }

    return new Response(
      JSON.stringify({ lap_ids: uniqueIds, per_lap: perLap, files: allFiles }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error && err.name === "AbortError"
      ? "Upstream request timed out"
      : (err as Error)?.message ?? "Unexpected error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});


