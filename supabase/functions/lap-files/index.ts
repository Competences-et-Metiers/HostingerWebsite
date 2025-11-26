// @ts-nocheck
// supabase/functions/lap-files/index.ts
// Fetch shared files for given LAP IDs from Dendreo:
// GET fichiers.php?cible=lap&id_cible=[LAP_ID]&collection_name=partage_lap&key=...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { normalizeToArray, readJsonSafe } from "../_shared/dendreo-utils.ts";

const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "https://yourapp.com"]; // adjust

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

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    const requested = (req.headers.get("access-control-request-headers") || "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
    const defaultAllowed = (headers["Access-Control-Allow-Headers"] || "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
    const merged = Array.from(new Set([...defaultAllowed, ...requested])).join(", ");
    const preflightHeaders = {
      ...headers,
      "Access-Control-Allow-Headers": merged || headers["Access-Control-Allow-Headers"],
      "Access-Control-Max-Age": "86400",
    } as Record<string, string>;
    return new Response(null, { headers: preflightHeaders, status: 200 });
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
        // Use normalizeToArray to handle both single files and arrays
        const files = normalizeToArray(r.body, {
          idProperty: 'id',
          wrapperProperties: ['fichiers', 'files']
        });
        for (const f of files) allFiles.push(f);
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


