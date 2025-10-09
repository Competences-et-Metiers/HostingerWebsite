// @ts-nocheck
// supabase/functions/dendreo/index.ts
// A proxy Edge Function for Dendreo "actions_de_formation" endpoint.
// Accepts query params: id (required), include (optional; defaults to "creneaux")

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "https://yourapp.com"]; // adjust

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function parseHoursValue(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    // HH:MM or HH:MM:SS
    const hms = /^\s*(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*$/;
    const m = trimmed.match(hms);
    if (m) {
      const h = parseInt(m[1] ?? "0", 10) || 0;
      const mi = parseInt(m[2] ?? "0", 10) || 0;
      const s = parseInt(m[3] ?? "0", 10) || 0;
      return h + mi / 60 + s / 3600;
    }
    const normalized = trimmed.replace(",", ".");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parseSecondsToHours(raw: unknown): number {
  if (typeof raw === "number") return raw / 3600;
  if (typeof raw === "string") {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n / 3600 : 0;
  }
  return 0;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  // CORS preflight
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
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing 'id' query parameter" }), {
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

    // Build both URLs
    const actionsUrl = new URL("https://pro.dendreo.com/competences_et_metiers/api/actions_de_formation.php");
    actionsUrl.searchParams.set("id", id);
    actionsUrl.searchParams.set("include", "creneaux");
    actionsUrl.searchParams.set("key", apiKey);

    const creneauxUrl = new URL("https://pro.dendreo.com/competences_et_metiers/api/creneaux.php");
    creneauxUrl.searchParams.set("id_action_de_formation", id);
    creneauxUrl.searchParams.set("include", "lcps");
    creneauxUrl.searchParams.set("key", apiKey);

    // Timeouts and parallel fetch
    const controller1 = new AbortController();
    const controller2 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 15_000);
    const timeout2 = setTimeout(() => controller2.abort(), 15_000);

    const [resActions, resCreneaux] = await Promise.all([
      fetch(actionsUrl.toString(), { method: "GET", signal: controller1.signal }).finally(() => clearTimeout(timeout1)),
      fetch(creneauxUrl.toString(), { method: "GET", signal: controller2.signal }).finally(() => clearTimeout(timeout2)),
    ]);

    const contentType1 = resActions.headers.get("content-type") ?? "";
    const contentType2 = resCreneaux.headers.get("content-type") ?? "";
    const isJson1 = contentType1.includes("application/json");
    const isJson2 = contentType2.includes("application/json");

    if (!resActions.ok) {
      const body = isJson1 ? await resActions.json().catch(() => ({})) : await resActions.text();
      return new Response(
        JSON.stringify({
          error: "Dendreo API error (actions_de_formation)",
          status: resActions.status,
          details: body,
        }),
        { status: resActions.status, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    if (!resCreneaux.ok) {
      const body = isJson2 ? await resCreneaux.json().catch(() => ({})) : await resCreneaux.text();
      return new Response(
        JSON.stringify({
          error: "Dendreo API error (creneaux)",
          status: resCreneaux.status,
          details: body,
        }),
        { status: resCreneaux.status, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    let actionsData: unknown = null;
    if (isJson1) {
      actionsData = await resActions.json();
    } else {
      try {
        const txt = await resActions.text();
        actionsData = JSON.parse(txt);
      } catch {
        actionsData = null;
      }
    }

    let creneauxData: unknown = null;
    if (isJson2) {
      creneauxData = await resCreneaux.json();
    } else {
      try {
        const txt = await resCreneaux.text();
        creneauxData = JSON.parse(txt);
      } catch {
        creneauxData = null;
      }
    }

    // total hours from total_heures_participants (already in hours)
    let totalHours = 0;
    let title = ""; // ADF title (intitule)
    if (actionsData && typeof actionsData === "object") {
      const raw = (actionsData as Record<string, unknown>)["total_heures_participants"] as unknown;
      const parsed = typeof raw === "string" ? parseFloat(raw.replace(",", ".")) : typeof raw === "number" ? raw : NaN;
      totalHours = Number.isFinite(parsed) ? parsed : 0;
      const rawTitle = (actionsData as Record<string, unknown>)["intitule"] as unknown;
      if (typeof rawTitle === "string" && rawTitle.trim()) title = rawTitle.trim();
    }

    // spent hours from creneaux.heures_presence (parse flexible formats)
    let spentHours = 0;
    if (Array.isArray(creneauxData)) {
      for (const item of creneauxData) {
        const lcps = (item as Record<string, unknown>)["lcps"] as unknown;
        if (Array.isArray(lcps)) {
          for (const lcp of lcps) {
            const hp = parseHoursValue((lcp as Record<string, unknown>)["heures_presence"]);
            if (hp > 0 && Number.isFinite(hp)) spentHours += hp;
          }
        } else {
          const hp = parseHoursValue((item as Record<string, unknown>)["heures_presence"]);
          if (hp > 0 && Number.isFinite(hp)) spentHours += hp;
        }
      }
    } else if (creneauxData && typeof creneauxData === "object") {
      const nested = (creneauxData as Record<string, unknown>)["creneaux"] as unknown;
      if (Array.isArray(nested)) {
        for (const c of nested) {
          const lcps = (c as Record<string, unknown>)["lcps"] as unknown;
          if (Array.isArray(lcps)) {
            for (const lcp of lcps) {
              const hp = parseHoursValue((lcp as Record<string, unknown>)["heures_presence"]);
              if (hp > 0 && Number.isFinite(hp)) spentHours += hp;
            }
          } else {
            const hp = parseHoursValue((c as Record<string, unknown>)["heures_presence"]);
            if (hp > 0 && Number.isFinite(hp)) spentHours += hp;
          }
        }
      } else {
        const lcps = (creneauxData as Record<string, unknown>)["lcps"] as unknown;
        if (Array.isArray(lcps)) {
          for (const lcp of lcps) {
            const hp = parseHoursValue((lcp as Record<string, unknown>)["heures_presence"]);
            if (hp > 0 && Number.isFinite(hp)) spentHours += hp;
          }
        } else {
          const hp = parseHoursValue((creneauxData as Record<string, unknown>)["heures_presence"]);
          if (hp > 0 && Number.isFinite(hp)) spentHours += hp;
        }
      }
    }

    // If title missing, try to extract from creneaux.formation.intitule
    if (!title) {
      const tryExtractFrom = (obj: unknown): string | null => {
        if (!obj || typeof obj !== "object") return null;
        const formation = (obj as Record<string, unknown>)["formation"] as unknown;
        if (formation && typeof formation === "object") {
          const t = (formation as Record<string, unknown>)["intitule"] as unknown;
          if (typeof t === "string" && t.trim()) return t.trim();
        }
        return null;
      };
      if (Array.isArray(creneauxData)) {
        for (const item of creneauxData) {
          const t = tryExtractFrom(item);
          if (t) { title = t; break; }
        }
      } else if (creneauxData && typeof creneauxData === "object") {
        const nested = (creneauxData as Record<string, unknown>)["creneaux"] as unknown;
        if (Array.isArray(nested)) {
          for (const c of nested) {
            const t = tryExtractFrom(c);
            if (t) { title = t; break; }
          }
        } else {
          const t = tryExtractFrom(creneauxData);
          if (t) title = t;
        }
      }
    }

    // remaining = total - spent (clamped)
    if (!Number.isFinite(spentHours)) spentHours = 0;
    if (!Number.isFinite(totalHours)) totalHours = 0;
    if (spentHours < 0) spentHours = 0;
    if (totalHours < 0) totalHours = 0;
    let remainingHours = totalHours - spentHours;
    if (!Number.isFinite(remainingHours) || remainingHours < 0) remainingHours = 0;

    return new Response(
      JSON.stringify({ id, intitule: title, spent_hours: spentHours, remaining_hours: remainingHours, total_hours: totalHours }),
      { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error && err.name === "AbortError"
      ? "Upstream request timed out"
      : (err as Error)?.message ?? "Unexpected error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });
  }
});
